/**
 * Cache is for stuff fetched from AP by the local server
 * and not for the browser client
 */
class ItemCache {
	constructor(type, size, period) {
		this.type = type;
		this.size = size;
		this.period = period;
		this.map = new Map();
		this.head = {};
		this.tail = {};
		this.head.next = this.tail
		this.tail.prev = this.head;
	}

	scanDates() {
		//Get oldest in
		var head = this.head;
		var now = Date.now();

		while(Boolean(head.next)){
			var node = head.next;
			if ((now - node.date) > this.period) {
				this.removeNode(node)
			}
			head = node;
		}
	}

	removeNode(node) {
		var next = node.next;
		node.next.prev = node.prev
		node.prev.next = node.next
		this.map.delete(node.key);
		return next;
	}

	get(id) {
		if (this.map.has(id)) {
			console.log(`found ${this.type}: ${id}`);
			// remove elem from current position
			let c = this.map.get(id);
			c.prev.next = c.next;
			c.next.prev = c.prev;

			this.tail.prev.next = c; // insert it after last element. Element before tail
			c.prev = this.tail.prev; // update c.prev and next pointer
			c.next = this.tail;
			this.tail.prev = c; // update last element as tail

			return c.value;
		} else {
			return null; // element does not exist
		}
	}

	put(id, item) {
		if (this.get(id) !== null) {
			// if key does exist, update last element with new value
			console.log(`updating ${this.type}: ${id}`);
			this.tail.prev.value = item;
			this.tail.prev.date = Date.now()
		} else {
			console.log(`adding ${this.type}: ${id}`);
			// check if map size is at capacity
			if (this.map.size === this.capacity) {
				//delete item both from map and DLL
				this.map.delete(this.head.next.key); // delete first element of list
				this.head.next = this.head.next.next; // update first element as next element
				this.head.next.prev = this.head;
			}

			let newNode = {
				date: Date.now(),
				value: item,
				key: id,
			}; // each node is a hashtable that stores key and value

			// when adding a new node, we need to update both map and DLL
			this.map.set(id, newNode); // add current node to map
			this.tail.prev.next = newNode; // add node to end of the list
			newNode.prev = this.tail.prev; // update prev and next pointers of newNode
			newNode.next = this.tail;
			this.tail.prev = newNode; // update last element
		}
	}
}
export default ItemCache;