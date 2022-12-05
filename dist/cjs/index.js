'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var d3Selection = require('d3-selection');
var d3Array = require('d3-array');

class DataStore {
  constructor(data, pageSize = 10) {
    this.all_data = data.slice(); // all rows
    this.filtered_data = data.slice(); // filtered data

    this.rows_shown = pageSize;
    this.page_size = pageSize;
  }

  filter(fn) {
    const truth = () => true;
    this.filtered_data = this.all_data.filter(fn || truth);
    return this.currentData;
  }

  sort(fn) {
    this.filtered_data.sort((a, b) => {
      return fn(a, b);
    });
    return this.currentData;
  }

  nextPage() {
    this.rows_shown += this.page_size;
    return this.currentData;
  }

  collapse() {
    this.rows_shown = this.page_size;
    return this.currentData;
  }

  set pageSize(size) {
    this.page_size = size;
    this.rows_shown = size;
  }

  get currentData() {
    return this.filtered_data.slice(0, this.rows_shown);
  }

  get onlyOnePage() {
    return this.filtered_data <= this.page_size;
  }
}

const d3$1 = {selection: d3Selection.selection, select: d3Selection.select, groups: d3Array.groups};

const getMobileBreakdown = () => {
  const viewport = window.innerWidth;

  if (viewport <= 576) {
    return "xs";
  } else if (viewport <= 768) {
    return "sm";
  } else if (viewport <= 992) {
    return "md";
  } else if (viewport <= 1200) {
    return "lg";
  } else {
    return "rest";
  }
};

function Table(params) {
  init_patternify();

  const attrs = Object.assign(
    {
      id: Math.floor(Math.random() * 10000000),
      container: "body",
      data: [], // all data
      headers: [], // column configs
      cellHeight: 60, // height of each cells in table body
      firstColumnWidth: {
        // city column width (varies based on screen size),
        xs: 140,
        sm: 130,
        md: 145,
        lg: 160,
        rest: 175,
      },
      pageSize: {
        // show
        xs: 6,
        sm: 10,
        md: 10,
        lg: 10,
        rest: 12,
      },
      numOfColumnsMobile: {
        xs: 2,
        sm: 3,
        md: 8,
        lg: 10,
        rest: 12,
      },
      mobileBreakdown: "xs",
      pagination: true,
      sortable: true,
      responsive: true,
    },
    params
  );

  let store,
    showMoreOrLessBtn,
    eachWidth,
    viewPortWidth,
    container, // container div (d3 selection)
    table, // table.choropleth div
    headerCategories,
    tableHeader, // header div
    tableRow, // table rows (d3 selection)
    tBody, // table body div
    tableHeadCells, // table header cells (d3 selection)
    transitionDuration = 1000, // how long should the transition take
    headers = attrs.headers, // headers passed from main.js
    categoryTitles = null,
    showNColumnsMobile = 2, // how many columns to show on mobile scrollable horizontally;
    currentSort = null, // current sort column
    firstColumnWidth,
    pageSize;

  const getValue = (d, propName) => {
    let prop = propName;
    if (typeof propName === "function") {
      prop = propName(d);
    }
    return d[prop];
  };

  function main() {
    setDimensions();

    store = new DataStore(attrs.data, pageSize);
    container = d3$1.select(attrs.container);
    currentSort = headers.find((d) => d.order);

    categoryTitles = d3$1
      .groups(
        headers.filter((d) => d.category),
        (d) => d.category
      )
      .map((d, i) => {
        return {
          title: d[0],
          headers: d[1].length,
          isMainColumn: d[1][0].isMainColumn,
        };
      });

    table = container.patternify({
      tag: "div",
      selector: "table-grid",
    });

    headerCategories = table.patternify({
      tag: "div",
      selector: "table-categories",
    });

    tableHeader = table.patternify({
      tag: "div",
      selector: "table-header",
    });

    tBody = table
      .patternify({
        tag: "div",
        selector: "table-body",
      })
      .style("position", "relative");

    drawAll();
  }

  function setDimensions() {
    const br = getMobileBreakdown();

    // if responsive and pagination are true, results blank columns
    if (attrs.responsive && !attrs.pagination) {
      attrs.responsive = false;
    }

    pageSize = attrs.pagination ? attrs.pageSize[br] : attrs.data.length + 1;
    showNColumnsMobile = attrs.numOfColumnsMobile[br];
    firstColumnWidth = attrs.firstColumnWidth[br];

    if (store) {
      store.pageSize = pageSize;
    }
  }

  function drawAll(resize) {
    if (attrs.pagination) {
      showMoreOrLessBtn = container
        .patternify({
          tag: "button",
          selector: "show-btn",
        })
        .attr("class", "show-btn btn")
        .text("SHOW MORE")
        .on("click", function () {
          if (store.currentData.length >= store.filtered_data.length) {
            collapse();
          } else {
            showMore();
          }
        });

      adjustShowBtn();
    } else {
      container.selectAll(".show-btn").remove();
    }

    table.classed("v-scrollable", attrs.responsive);
    tBody.classed("h-scrollable", !attrs.pagination);

    if (categoryTitles.length) {
      addCategoryTitles();
    }

    addTableHead(resize);
    addTableBody();

    if (attrs.pagination) {
      adjustHeight();
    }

    if (attrs.responsive) {
      makeItResponsive();
    }

    if (attrs.sortable) {
      if (currentSort) {
        sortTableBy(currentSort, false);
      }
    }
  }

  function addCategoryTitles() {
    if (!categoryTitles.some((d) => d.isMainColumn)) {
      categoryTitles.unshift({
        title: "main",
        headers: 1,
        isMainColumn: true,
        hidden: true,
      });
    }

    const catTitle = headerCategories
      .patternify({
        tag: "div",
        selector: "category-title",
        data: categoryTitles,
      })
      .html((d) => d.title)
      .classed("main-column", (d) => d.isMainColumn)
      .style("width", (d) => {
        if (d.isMainColumn) {
          return `${firstColumnWidth}px`;
        }
        return `calc(((100% - ${firstColumnWidth}px) / ${headers.length - 1}) * ${d.headers})`;
      })
      .style("visibility", (d) => {
        return d.hidden ? "hidden" : null;
      });

    catTitle.patternify({
      tag: "div",
      selector: "cat-border",
    });
  }

  function addTableHead(resize) {
    tableHeadCells = tableHeader
      .patternify({
        tag: "div",
        selector: "table-head",
        data: headers,
      })
      .attr("class", (d, i) => {
        return (
          "table-head" +
          (d.isMainColumn ? " main-column" : "") +
          (d.class ? " " + d.class : "")
        );
      })
      .style("width", getWidth);

    tableHeadCells.each(function (d) {
      if (resize && d.isMainColumn) {
        return;
      }

      if (d.headerTemplate && typeof d.headerTemplate === "function") {
        d.headerTemplate(d).then((html) => {
          d3$1.select(this).html(html);
        });
      } else {
        d3$1.select(this).html(d.name);
      }
    });

    // click events for the columns with has sort true
    tableHeadCells
      .filter((d) => d.sort)
      .on("click", (e, d) => {
        if (d.order == "asc") {
          d.order = "desc";
        } else {
          d.order = "asc";
        }

        sortTableBy(d);
      });
  }

  function addTableBody() {
    tableRow = tBody
      .patternify({
        tag: "div",
        selector: "table-row",
        data: store.currentData,
      })
      .style("left", "0px")
      .style("top", function (d, i) {
        return i * attrs.cellHeight + "px";
      });

    tableRow.each(function (d, i) {
      const that = d3$1.select(this);

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
        .style("width", getWidth)
        .style("height", attrs.cellHeight + "px");

      tableData
        .patternify({
          tag: "div",
          selector: "table-data-inner",
          data: (m) => [m],
        })
        .html((x) => {
          if (x.cellTemplate && typeof x.cellTemplate === "function") {
            return x.cellTemplate({
              ...d,
              value: getValue(d, x.propName),
            });
          }

          return getValue(d, x.propName);
        });
    });
  }

  function sortTableBy(d, animate = true) {
    if (!d.sort) return;

    // first sort data
    // store.sort((a, b) => d.sort(a, b, d.order));

    // get first N rows and shuffle for transition
    // data = shuffle(data.slice(0, numOfRows));

    // redraw rows
    // updateRows();

    // grey out all icons and clear order property for other headers
    tableHeadCells
      .filter((d) => d.sort)
      .each(function (x) {
        const icon = d3$1.select(this);

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
    tableRow
      .sort((a, b) => d.sort(a, b, d.order))
      .transition()
      .duration(animate ? transitionDuration : 0)
      .style("top", (_, i) => {
        return i * attrs.cellHeight + "px";
      });

    currentSort = d;
  }

  function getWidth(d) {
    if (d.isMainColumn) {
      return firstColumnWidth + "px";
    }

    return `calc((100% - ${firstColumnWidth}px) / ${headers.length - 1})`;
  }

  function adjustHeight() {
    const tableHeaderHeight = tableHeader.node().getBoundingClientRect().height;

    table.style(
      "height",
      tableHeaderHeight + 22 + attrs.cellHeight * store.currentData.length + "px"
    );
  }

  function makeItResponsive() {
    viewPortWidth = container.node().getBoundingClientRect().width;
    eachWidth = (viewPortWidth - firstColumnWidth) / showNColumnsMobile;

    const w = Math.max(
      viewPortWidth,
      eachWidth * (headers.length - 1) + firstColumnWidth
    );

    if (getMobileBreakdown() === attrs.mobileBreakdown && w > viewPortWidth) {
      tBody.style("position", "static");
      table.classed("responsive", true);

      tableRow
        .style("width", w - firstColumnWidth + "px")
        .style("position", "static");

      headerCategories.style("width", w - firstColumnWidth + "px");

      headerCategories.selectAll(".category-title").style("width", (d, i) => {
        if (d.isMainColumn) return firstColumnWidth + "px";
        return `calc((100% / ${headers.length - 1}) * ${d.headers})`;
      });

      tableHeader.style("width", w - firstColumnWidth + "px");

      table
        .selectAll(".main-column")
        .style("position", "absolute")
        .style("margin-left", -firstColumnWidth + "px");

      table.style("margin-left", firstColumnWidth + "px");

      table
        .selectAll(".value-column")
        .style("width", `calc(100% / ${headers.length - 1})`);

      table.selectAll(".table-head").style("width", (d, i) => {
        if (d.isMainColumn) return firstColumnWidth + "px";
        return `calc(100% / ${headers.length - 1})`;
      });
    } else {
      table.classed("responsive", false);
      table
        .selectAll(".main-column")
        .style("position", null)
        .style("margin-left", null);

      table.selectAll(".table-head").style("width", getWidth);

      table
        .selectAll(".table-data")
        .style("width", getWidth)
        .style("height", attrs.cellHeight + "px");

      tBody.style("position", "relative");
      table.style("margin-left", null);

      tableRow
        .style("width", null)
        .style("margin-left", null)
        .style("position", null);

      tableHeader.style("width", null).style("margin-left", null);

      headerCategories.style("width", null);

      headerCategories.selectAll(".category-title").style("width", (d) => {
        if (d.isMainColumn) {
          return `${firstColumnWidth}px`;
        }
        return `calc(((100% - ${firstColumnWidth}px) / ${
          headers.length - 1
        }) * ${d.headers})`;
      });
    }
  }

  function adjustShowBtn() {
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

  function updateRows() {
    table.classed("v-scrollable", attrs.responsive);
    tBody.classed("h-scrollable", !attrs.pagination);

    addTableBody();

    if (attrs.pagination) {
      adjustHeight();
    }

    if (attrs.responsive) {
      makeItResponsive();
    }
  }

  function showMore() {
    store.nextPage();
    adjustShowBtn();
    updateRows();

    if (currentSort && attrs.sortable) {
      sortTableBy(currentSort, false);
    }
  }

  function collapse() {
    store.collapse();
    adjustShowBtn();
    updateRows();

    if (currentSort && attrs.sortable) {
      sortTableBy(currentSort, false);
    }
  }

  main.filter = function (filterFunction) {
    store.filter(filterFunction);

    adjustShowBtn();
    addTableBody();

    if (attrs.pagination) {
      adjustHeight();
    }

    if (currentSort && attrs.sortable) {
      sortTableBy(currentSort, false);
    }
  };

  main.render = function () {
    main();

    let tableWidth = window.innerWidth;

    // window resize
    d3$1.select(window).on("resize." + attrs.id, function () {
      
      if (tableWidth !== window.innerWidth) {
        setDimensions();
        drawAll(true);
      }

      tableWidth = window.innerWidth;
    });
    return main;
  };

  return main;
}

function init_patternify() {
  d3$1.selection.prototype.patternify = function (params) {
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

const d3 = {selection: d3Selection.selection, select: d3Selection.select, groups: d3Array.groups, sum: d3Array.sum};

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

exports.DataStore = DataStore;
exports.Table = Table;
exports.TableCompact = TableCompact;
//# sourceMappingURL=index.js.map
