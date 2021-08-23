### Lightweight table grid component

| | |
|:-------------------------:|:-------------------------:|
|<a href="https://giorgi-ghviniashvili.github.io/table-grid/"><img height="400px" src="https://giorgi-ghviniashvili.github.io/table-grid/images/light.png"></a><div style="100%">Default</div> | <a href="https://giorgi-ghviniashvili.github.io/table-grid/dark.html"><img  height="400px" src="https://giorgi-ghviniashvili.github.io/table-grid/images/dark.png"></a><div style="100%">Dark</div>|

Features: 
* responsive
* highly configurable
* dynamic columns with icons
* sortable and filterable
* column categories
* different themes
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
    sort: false, // disable sort
    cellTemplate: (d) => {
      return `${d.City}`;
    },
    headerTemplate: () => {
      return new Promise((res) => {
        res(`<div class="table-icon">
          <div class="arrow">
            ${arrow}
          </div>
          <div class="location-txt">
            Location
          </div>
        </div>`)
      })
    },
  },
  {
    id: 1,
    name: "Column A",
    icon: "icon url here",
    propName: "column_a",
    rankProp: "column_a",
    sort: sortFunc,
    class: "", // apply additional class
    cellTemplate: () => {
      return `<h1>Any html content here</h1>`
    },
    headerTemplate: () => {
      return new Promise((res) => {
        res(`<div class="table-icon">
          <div class="arrow">
            ${arrow}
          </div>
          <div class="square-icon">
            <div class="icon">[icon svg as text]</div>
          </div>
          <div class="header-text">
            ${name}
          </div>
        </div>`)
      })
    },
    order: "asc", // default order
    colorScale: (colorDomain) => d3.scaleQuantile(colorDomain, colors),
    category: "category a"
  }
]
```