class Feed {
  status = $state.raw("idle");
  thoughts = $state([]);

  constructor() {}

  reset() {
    this.status = "idle";
    this.thoughts = [];
  }
}

export default new Feed();
