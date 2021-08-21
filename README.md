Lightweight table grid component

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