import { selection, select } from "d3-selection";
import { groups, sum } from "d3-array";
import DataStore from "./DataStore";

const d3 = {selection, select, groups, sum};

class TableCompact {
  constructor(params) {
    this.init_patternify();

    this.attrs = Object.assign(
      {
        id: Math.floor(Math.random() * 10000000),
        container: "body",
        data: [],
        headers: [],
        cellHeight: 48,
        rowsOnPage: 10,
        pagination: true,
        sortable: true,
        rowGap: 4,
        onResize: () => {},
        rowTooltip: () => {},
        onRowClick: () => {},
      },
      params
    );

    this.transitionDuration = 1000;
    this.headers = this.attrs.headers;

    this.main();
    this.setResizeHandler();
  }

  main() {
    const { attrs, headers } = this;

    this.setDimensions();

    this.store = new DataStore(attrs.data, this.pageSize);
    this.container = d3.select(attrs.container);
    this.currentSort = headers.find((d) => d.order);

    this.table = this.container.patternify({
      tag: "div",
      selector: "table-grid",
    });

    this.tableHeader = this.table.patternify({
      tag: "div",
      selector: "table-header",
    });

    this.tBody = this.table
      .patternify({
        tag: "div",
        selector: "table-body",
      })
      .style("position", "relative")
      .style("overflow-y", attrs.pagination ? "visible" : null);

    this.drawAll();
  }

  drawAll(resize) {
    const { attrs, container } = this;

    this.sumOfRatios = d3.sum(this.headers, (d) => d.widthRatio || 1);

    if (attrs.pagination) {
      this.showMoreOrLessBtn = container
        .patternify({
          tag: "button",
          selector: "show-btn",
        })
        .attr("class", "show-btn btn")
        .text("SHOW MORE")
        .on("click", () => {
          if (
            this.store.currentData.length >= this.store.filtered_data.length
          ) {
            this.collapse();
          } else {
            this.showMore();
          }
        });

      this.adjustShowBtn();
    } else {
      container.selectAll(".show-btn").remove();
    }

    this.addTableHead(resize);
    this.addTableBody();

    if (attrs.pagination) {
      this.adjustHeight();
    }

    if (attrs.sortable) {
      if (this.currentSort) {
        this.sortTableBy(this.currentSort, false);
      }
    }
  }

  addTableHead(resize) {
    this.tableHeadCells = this.tableHeader
      .patternify({
        tag: "div",
        selector: "table-head",
        data: this.headers,
      })
      .attr("class", (d, i) => {
        return (
          "table-head" +
          (d.isMainColumn ? " main-column" : "") +
          (d.class ? " " + d.class : "")
        );
      });

    this.tableHeadCells.style("width", (d) => this.getWidth(d));

    this.tableHeadCells.each(function (d) {
      if (resize && d.isMainColumn) {
        return;
      }

      if (d.headerTemplate && typeof d.headerTemplate === "function") {
        const tmplt = d.headerTemplate(d);

        if (tmplt.then) {
          tmplt.then((html) => {
            d3.select(this).html(html);
          });
        } else {
          d3.select(this).html(tmplt);
        }
      } else {
        d3.select(this).html(d.name);
      }

      if (d.tooltip) {
        if (this._tippy) {
          this._tippy.destroy();
        }

        const html = typeof d.tooltip === "function" ? d.tooltip(d) : d.tooltip;

        tippy(this, {
          theme: "light",
          content: html,
          arrow: true,
          allowHTML: true,
          maxWidth: 220,
          placement: "top",
          onShow: () => window.innerWidth > 576,
        });
      }
    });

    // click events for the columns with has sort true
    this.tableHeadCells
      .filter((d) => d.sort)
      .on("click", (e, d) => {
        if (this.attrs.sortable) {
          if (d.order == "asc") {
            d.order = "desc";
          } else {
            d.order = "asc";
          }
          this.sortTableBy(d);
        }
      });
  }

  addTableBody() {
    const { headers, attrs } = this;
    const self = this;

    const tableRow = this.tBody
      .patternify({
        tag: "div",
        selector: "table-row",
        data: this.store.currentData,
      })
      .style("left", "0px")
      .style("top", (d, i) => {
        return i * (attrs.cellHeight + attrs.rowGap) + "px";
      })
      .on("click", (e, d) => {
        if (window.innerWidth <= 576) {
          tableRow.classed("highlighted", false);
          d3.select(e.target).classed("highlighted", true);
          attrs.onRowClick(d);
        }
      });

    tableRow.each(function (d, i) {
      const that = d3.select(this);

      const tableData = that
        .patternify({
          tag: "div",
          selector: "table-data",
          data: headers,
        })
        .attr("class", (d) => {
          return (
            "table-data" +
            (d.isMainColumn ? " main-column" : " value-column") +
            (d.class ? " " + d.class : "")
          );
        })
        .style("width", (d) => self.getWidth(d))
        .style("height", attrs.cellHeight + "px");

      tableData
        .patternify({
          tag: "div",
          selector: "table-data-inner",
          data: (m) => [m],
        })
        .html((x) => {
          if (x.cellTemplate && typeof x.cellTemplate === "function") {
            return x.cellTemplate(
              {
                ...d,
                value: self.getValue(d, x.propName),
              },
              x
            );
          }

          return self.getValue(d, x.propName);
        });

      const tooltipHtml = attrs.rowTooltip(d);

      if (this._tippy) {
        this._tippy.destroy();
      }

      tippy(this, {
        theme: "light",
        content: tooltipHtml,
        arrow: true,
        allowHTML: true,
        maxWidth: 350,
        trigger: "click",
        placement: "right",
        zIndex: 999999,
        offset: [0, -318],
        onHide: () => tableRow.classed("highlighted", false),
        onShow: () => {
          if (window.innerWidth > 576) {
            that.classed("highlighted", true);
            return true;
          }
          return false;
        },
      });
    });

    this.tableRow = tableRow;
  }

  sortTableBy(d, animate = true) {
    if (!d.sort) return;

    // grey out all icons and clear order property for other headers
    this.tableHeadCells
      .filter((d) => d.sort)
      .each(function (x) {
        const icon = d3.select(this);

        if (x.id === d.id) {
          icon.classed("active", true);
          icon.classed(x.order === "asc" ? "desc" : "asc", false);
          icon.classed(x.order, true);
        } else {
          x.order = null;
          icon.classed("active", false);
          icon.classed("desc", false);
          icon.classed("asc", false);
        }
      });

    // sorting table rows
    this.tableRow
      .sort((a, b) => d.sort(a, b, d.order))
      .transition()
      .duration(animate ? this.transitionDuration : 0)
      .style("top", (_, i) => {
        return i * (this.attrs.cellHeight + this.attrs.rowGap) + "px";
      });

    this.currentSort = d;
  }

  getValue(d, propName) {
    let prop = propName;
    if (typeof propName === "function") {
      prop = propName(d);
    }
    return d[prop];
  }

  setDimensions() {
    this.pageSize = this.attrs.pagination
      ? this.attrs.rowsOnPage
      : this.attrs.data.length + 1;

    if (this.store) {
      this.store.pageSize = this.pageSize;
    }
  }

  getWidth(d) {
    const percent = (d.widthRatio || 1) / this.sumOfRatios;
    return percent * 100 + "%";
  }

  adjustHeight() {
    const tableHeaderHeight = this.tableHeader
      .node()
      .getBoundingClientRect().height;

    const height =
      tableHeaderHeight +
      (this.attrs.cellHeight + this.attrs.rowGap) *
        this.store.currentData.length;

    this.table.style("height", height + "px");
    this.tBody.style("height", height + "px");
  }

  adjustShowBtn() {
    const { showMoreOrLessBtn, store } = this;
    if (store.onlyOnePage) {
      showMoreOrLessBtn.style("display", "none");
    } else {
      showMoreOrLessBtn.style("display", null);

      if (store.currentData.length >= store.filtered_data.length) {
        showMoreOrLessBtn.text("SHOW LESS");
      } else {
        showMoreOrLessBtn.text("SHOW MORE");
      }
    }
  }

  updateRows() {
    this.addTableBody();

    if (this.attrs.pagination) {
      this.adjustHeight();
    }
  }

  showMore() {
    this.store.nextPage();
    this.adjustShowBtn();
    this.updateRows();

    if (this.currentSort && this.attrs.sortable) {
      this.sortTableBy(this.currentSort, false);
    }
  }

  collapse() {
    this.store.collapse();
    this.adjustShowBtn();
    this.updateRows();

    if (this.currentSort && this.attrs.sortable) {
      this.sortTableBy(this.currentSort, false);
    }
  }

  filter(filterFunction) {
    this.store.filter(filterFunction);

    this.adjustShowBtn();
    this.addTableBody();

    if (this.attrs.pagination) {
      this.adjustHeight();
    }

    if (this.currentSort && this.attrs.sortable) {
      this.sortTableBy(this.currentSort, false);
    }
  }

  showColumns(visibleHeaders) {
    this.headers = visibleHeaders;
    this.drawAll();
  }

  unhighlight() {
    this.tableRow.classed("highlighted", false);
  }

  setResizeHandler() {
    let curWidth = window.innerWidth;

    // window resize
    d3.select(window).on("resize." + this.attrs.id, () => {
      if (curWidth !== window.innerWidth) {
        this.setDimensions();
        this.drawAll(true);
        this.attrs.onResize();
      }
      curWidth = window.innerWidth;
    });
  }

  init_patternify() {
    d3.selection.prototype.patternify = function (params) {
      var container = this;
      var selector = params.selector;
      var elementTag = params.tag;
      var data = params.data || [selector];
  
      // Pattern in action
      var selection = container.selectAll("." + selector).data(data, (d, i) => {
        if (typeof d === "object") {
          if (d.id) {
            return d.id;
          }
        }
        return i;
      });
      selection.exit().remove();
      selection = selection.enter().append(elementTag).merge(selection);
      selection.attr("class", selector);
      return selection;
    };
  }
}

export default TableCompact;