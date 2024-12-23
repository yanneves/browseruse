class Browser {
  render = $state.raw(null);

  constructor() {}

  reset() {
    this.render = null;
  }
}

export default new Browser();
