class PriorityQueue {
  constructor() {
    this.items = [];
  }

  push(node) {
    /**
     * If no heuristic value, just push into the array
     */
    if(node.heuristic === 0) {
        this.items.push(node);
        return;     
    }

    /**
     * Using binary-insert for efficiency
     */
    let low = 0;
    let high = this.items.length;

    while (low < high) {
      const mid = (low + high) >> 1;
      const cmp = this.compare(node, this.items[mid]);
      if (cmp < 0) high = mid;
      else low = mid + 1;
    }

    this.items.splice(low, 0, node);
  }

  shift() {
    return this.items.shift();
  }

  get length() {
    return this.items.length;
  }

  compare(a, b) {
    if (a.depth !== b.depth) return a.depth - b.depth; // BFS preserved
    return b.heuristic - a.heuristic; // within depth, higher heuristic first
  }
}


export default PriorityQueue;
