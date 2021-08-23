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
      data: [],
      headers: [],
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
        sm: 6,
        md: 8,
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
    },
    params
  );

  var data = attrs.data,
    numOfRows = data.length,
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
    timer,
    filterFunc,
    showN,
    firstColumnWidth;

  const getValue = (d, propName) => {
    let prop = propName;
    if (typeof propName === "function") {
      prop = propName(d);
    }
    return d[prop];
  };

  function main(resize = false) {
    const br = getMobileBreakdown();

    showN = attrs.pageSize[br];

    showNColumnsMobile = attrs.numOfColumnsMobile[br];
    firstColumnWidth = attrs.firstColumnWidth[br];

    container = d3.select(attrs.container);
    currentSort = headers.find((d) => d.order);

    if (currentSort) {
      attrs.data.sort((a, b) => currentSort.sort(a, b, currentSort.order));
    }

    data = attrs.data.slice(0, showN);
    numOfRows = data.length;

    categoryTitles = d3
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

    showMoreOrLessBtn = container
      .patternify({
        tag: "button",
        selector: "show-btn",
      })
      .attr("class", "show-btn btn")
      .text("SHOW MORE")
      .on("click", function () {
        if (numOfRows === attrs.data.length) {
          collapse();
        } else {
          showMore();
        }

        if (numOfRows >= attrs.data.length) {
          showMoreOrLessBtn.text("SHOW LESS");
        } else {
          showMoreOrLessBtn.text("SHOW MORE");
        }
      });

    if (attrs.data.length <= showN) {
      showMoreOrLessBtn.style("display", "none");
    }

    drawAll(resize);
  }

  function drawAll(resize) {
    if (categoryTitles.length) {
      addCategoryTitles();
    }

    addTableHead(resize);
    addTableBody();
    adjustHeight();
    makeItResponsive();

    if (currentSort) {
      sortTableBy(currentSort, false);
    }

    if (filterFunc) {
      main.filter(filterFunc);
    }
  }

  function addCategoryTitles() {
    if (!categoryTitles.some(d => d.isMainColumn)) {
      categoryTitles.unshift({
        title: "main",
        headers: 1,
        isMainColumn: true,
        hidden: true,
      })
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
          d3.select(this).html(html);
        });
      } else {
        d3.select(this).html(d.name);
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
        data: data,
      })
      .style("left", "0px")
      .style("top", function (d, i) {
        return i * attrs.cellHeight + "px";
      });

    tableRow.each(function (d, i) {
      var that = d3.select(this);

      var tableData = that
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
    data.sort((a, b) => d.sort(a, b, d.order));

    // get first N rows and shuffle for transition
    data = shuffle(data.slice(0, numOfRows));

    // redraw rows
    updateRows();

    // grey out all icons and clear order property for other headers
    tableHeadCells
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
    var tableHeaderHeight = tableHeader.node().getBoundingClientRect().height;

    table.style(
      "height",
      tableHeaderHeight + 22 + attrs.cellHeight * numOfRows + "px"
    );
  }

  function makeItResponsive() {
    viewPortWidth = container.node().getBoundingClientRect().width;
    eachWidth = (viewPortWidth - firstColumnWidth) / showNColumnsMobile;

    var w = Math.max(
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

  function updateRows() {
    addTableBody();
    adjustHeight();
    makeItResponsive();
  }

  function showMore() {
    data = attrs.data.slice(0, Math.min(attrs.data.length, numOfRows + showN));
    numOfRows = data.length;

    if (currentSort) {
      sortTableBy(currentSort, false);
    } else {
      updateRows();
    }
  }

  function collapse() {
    data = attrs.data.slice(0, showN);
    numOfRows = data.length;

    if (currentSort) {
      sortTableBy(currentSort, false);
    } else {
      updateRows();
    }
  }

  main.createRowWithDetails = function (datum, container) {
    const w = Math.max(
      viewPortWidth,
      eachWidth * (headers.length - 1) + firstColumnWidth
    );

    const wrapper = container.patternify({
      tag: "div",
      selector: "details-wrapper",
    });

    const row = wrapper.patternify({
      tag: "div",
      selector: "table-row",
    });

    const tableData = row
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
      });

    tableData
      .patternify({
        tag: "div",
        selector: "info-row-header",
        data: (m) => [m],
      })
      .style("visibility", (d) => {
        if (d.isMainColumn) {
          return "hidden";
        }
        return null;
      })
      .html((x) => {
        return `<div class="header-text">
          ${x.name}
        </div>`;
      });

    tableData
      .patternify({
        tag: "div",
        selector: "table-data-inner",
        data: (m) => [m],
      })
      .html((x) => {
        const value = getValue(datum, x.propName);

        if (x.cellTemplate && typeof x.cellTemplate === "function") {
          return x.cellTemplate({ ...datum, value });
        }

        return value;
      });

    if (getMobileBreakdown() === attrs.mobileBreakdown && w > viewPortWidth) {
      row
        .style("position", "static")
        .style("width", w - firstColumnWidth + "px");

      wrapper.style("margin-left", firstColumnWidth + "px");

      tableData
        .style("width", (d) => {
          if (d.isMainColumn) {
            return firstColumnWidth + "px";
          }
          return `calc(100% / ${headers.length - 1})`;
        })
        .style("position", (d) => {
          return d.isMainColumn ? "absolute" : null;
        })
        .style("left", (d) => {
          return d.isMainColumn ? "0px" : null;
        });
    } else {
      tableData.style("width", (d) => {
        return getWidth(d);
      });
    }

    return row;
  };

  function init_patternify() {
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

  function shuffle(array) {
    var currentIndex = array.length,
      temporaryValue,
      randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  }

  main.filter = function (filterFunction) {
    data = attrs.data
      .filter(filterFunction || (() => true))
      .slice(0, numOfRows);

    if (numOfRows > data.length) {
      numOfRows = data.length;
    }

    filterFunc = filterFunction;

    addTableBody();
    adjustHeight();

    if (currentSort) {
      sortTableBy(currentSort, false);
    }
  };

  main.render = function () {
    main();
    // window resize
    d3.select(window).on("resize." + attrs.id, function () {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        main(true);
      }, 100);
    });
    return main;
  };

  return main;
}
