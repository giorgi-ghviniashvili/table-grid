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
  }

  get currentData() {
    return this.filtered_data.slice(0, this.rows_shown);
  }

  get onlyOnePage() {
    return this.filtered_data <= this.page_size;
  }
}