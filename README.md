Lightweight table grid component

|:-------------------------:|:-------------------------:|
|<a href="https://giorgi-ghviniashvili.github.io/table-grid/"><img height="400px" src="https://giorgi-ghviniashvili.github.io/table-grid/images/light.png"></a><div style="100%">Default</div> | <a href="https://giorgi-ghviniashvili.github.io/table-grid/dark.html"><img  height="400px" src="https://giorgi-ghviniashvili.github.io/table-grid/images/dark.png"></a> <div style="100%">Dark</div>|

Features: 
* responsive
* highly configurable
* dynamic columns with icons
* sortable and filterable
* only one dependency - d3.js v7
* color coded cells
* pagination

#### Initialize

```javascript
const table = Table({
  data,
  headers,
  container: "#table",
}).render();
```

#### Header format:

```javascript
const headers = [
  {
    id: 0,
    isMainColumn: true,
    name: "City",
    icon: null,
    propName: "City",
    sort: false,
    cellTemplate: (d) => {
      return `${d.City}`;
    },
    headerTemplate: mainHeaderTemplate,
  },
  {
    id: 1,
    name: "Column A",
    icon: "icon url here",
    propName: "column_a",
    rankProp: "column_a",
    sort: sortFunc,
    class: "",
    cellTemplate: function (d) {
      const rank = d[this.rankProp];
      return getColorBox(rank, rank, this.colorScale);
    },
    headerTemplate: headerTemplate,
    order: "asc",
    colorScale: d3.scaleQuantile([1, 5], colors),
  }
]
```