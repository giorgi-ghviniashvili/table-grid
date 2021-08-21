const colors = [
  "#17365D",
  "rgba(23, 54, 93, 0.6)",
  "rgba(151, 128, 139, 0.6)",
  "rgba(125, 54, 80, 0.6)",
  "#7D3650",
];

const arrow = `<svg width="14" height="12" viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.72431 10.5154C7.33862 11.178 6.38155 11.178 5.99586 10.5154L0.749374 1.5031C0.361282 0.836444 0.842204 -6.86199e-07 1.6136 -7.53081e-07L12.1066 -1.66285e-06C12.878 -1.72973e-06 13.3589 0.836442 12.9708 1.5031L7.72431 10.5154Z" fill="currentColor"/></svg>`;

const headerTemplate = ({ icon, name, tooltip }, el) => {
  const xhr = new XMLHttpRequest();

  xhr.open("GET", icon, false);

  xhr.overrideMimeType("text/plain");

  return new Promise((res, rej) => {
    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4) {
        if (xhr.status == 200) {
          res(`
            <div class="table-icon">
              <div class="arrow">
                ${arrow}
              </div>
              <div class="square-icon" ${
                tooltip ? `data-tippy-content="${tooltip}"` : ""
              }>
                <div class="icon">${xhr.responseText}</div>
              </div>
              <div class="header-text">
                ${name}
              </div>
            </div>
          `);
        } else {
          rej("");
        }
      }
    };

    xhr.send();
  });
};

const mainHeaderTemplate = () => {
  return new Promise((res) => {
    res(`<div class="table-icon">
      <div class="arrow">
        ${arrow}
      </div>
      <div class="location-txt">
        Location
      </div>
    </div>`);
  });
};

const getColorBox = (rank, value, colorScale) => {
  const color = colorScale(rank);
  const textColor = rank > 35 && rank < 52 ? "#17365D" : "#fff";

  return `<div 
    class="color-box" 
    style="background-color: ${color}; color: ${textColor};" 
    data-rank="${rank}"
  >
    <div class="value">${value}</div>
  </div>`;
};

function sortFunc(a, b, order) {
  const orderFuncReverse = order === "asc" ? "descending" : "ascending";
  if (a[this.rankProp] === b[this.rankProp]) {
    return d3[orderFuncReverse](a.Ranking, b.Ranking);
  }

  const orderFunc = order === "asc" ? "ascending" : "descending";
  return d3[orderFunc](a[this.rankProp], b[this.rankProp]);
}
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
    icon: "https://giorgi-ghviniashvili.github.io/typeamedia/tranquil-destinations/images/icons/hinduist-yoga-position.svg",
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
  },
  {
    id: 2,
    name: "Column B",
    icon: "https://giorgi-ghviniashvili.github.io/typeamedia/tranquil-destinations/images/icons/tap.svg",
    propName: "column_b",
    rankProp: "column_b",
    sort: sortFunc,
    class: "",
    cellTemplate: function (d) {
      const rank = d[this.rankProp];
      return getColorBox(rank, rank, this.colorScale);
    },
    headerTemplate: headerTemplate,
    order: "asc",
    colorScale: d3.scaleQuantile([1, 5], colors),
  },
  {
    id: 3,
    name: "Column B",
    icon: "https://giorgi-ghviniashvili.github.io/typeamedia/tranquil-destinations/images/icons/tap.svg",
    propName: "column_c",
    rankProp: "column_c",
    sort: sortFunc,
    class: "",
    cellTemplate: function (d) {
      const rank = d[this.rankProp];
      return getColorBox(rank, rank, this.colorScale);
    },
    headerTemplate: headerTemplate,
    order: "asc",
    colorScale: d3.scaleQuantile([1, 5], colors),
  },
  {
    id: 4,
    name: "Column B",
    icon: "https://giorgi-ghviniashvili.github.io/typeamedia/tranquil-destinations/images/icons/tap.svg",
    propName: "column_d",
    rankProp: "column_d",
    sort: sortFunc,
    class: "",
    cellTemplate: function (d) {
      const rank = d[this.rankProp];
      return getColorBox(rank, rank, this.colorScale);
    },
    headerTemplate: headerTemplate,
    order: "asc",
    colorScale: d3.scaleQuantile([1, 5], colors),
  },
];

const cities = [
  "Tbilisi",
  "Batumi",
  "Kutaisi",
  "Zugdidi",
  "Lanchxuti",
  "Mestia",
  "Telavi",
  "Gori",
  "Tkaltubo",
  "Stepantsminda",
  "Khashuri",
  "Dedoplistskaro",
  "Chiatura",
  "Tkibuli",
  ];

const data = (function () {
  const arr = [];

  const headerRanks = {};

  headers.slice(1).forEach((h) => {
    const ranks = new Map(shuffle(cities.slice()).map((d, i) => [d, i + 1]));
    headerRanks[h.propName] = ranks;
  });

  cities.forEach((c) => {
    const obj = { City: c };
    headers.slice(1).forEach((h) => {
      const ranks = headerRanks[h.propName];
      obj[h.propName] = ranks.get(c);
    });
    arr.push(obj);
  });

  return arr;
})();

const table = Table({
  data,
  headers,
  container: "#table",
}).render();

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