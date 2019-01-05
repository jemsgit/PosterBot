Events = function() {
    this.subscribers = {};
}

Events.prototype.on = function(type, fn) {
    if (typeof this.subscribers[type] === 'undefined') {
        this.subscribers[type] = [];
    }
    this.subscribers[type].push(fn);
};
Events.prototype.off = function(fn, type) {
    this.visitSubscribers('unsubscribe', type, fn);
};
Events.prototype.raise = function(type, data) {`1`
    this.visitSubscribers('raise', type, data);
};

Events.prototype.visitSubscribers = function(action, type, arg) {
    var pubtype = type,
        subscribers = this.subscribers[pubtype],
        i,
        max;
    console.log(subscribers)
    if (subscribers) {
        max = subscribers.length;
        for (i = 0; i < max; i += 1) {
            if (action === 'raise') {
                subscribers[i](arg);
            } else {
                if (subscribers[i] === arg) {
                    subscribers.splice(i, 1);
                }
            }
        }
    }

}

var events = new Events();

module.exports = events;
