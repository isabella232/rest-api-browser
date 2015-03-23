var Link = require('./link');
var Promise = require('promise');

module.exports = Entity;

function Entity(siren, parent, data) {
  this.siren = siren;
  this._parent = parent;
  this.data = data;
}

Entity.prototype.link = function link(rel) {
  var link = filterLinksByRel(this.data.links, rel);
  return link && new Link(this.siren, link);
};

Entity.prototype.property = function property(name) {
  return this.data.properties && this.data.properties[name];
};

Entity.prototype.hasClass = function hasClass(clazz) {
  return this.data.class && this.data.class.indexOf(clazz) > -1;
};

Entity.prototype.parent = function parentEntity() {
  return this._parent;
};

Entity.prototype.path = function path() {
  if (this.parent() === null) {
    return '';
  }
  return this.parent().path() + '/' + this.property('name');
};

Entity.prototype.children = function children(filterFn) {
  function any() {
    return true;
  }

  var self = this;
  var entities = self.data.entities;
  var children = entities.map(function loadChildren(jsonEntity) {
    var link = filterLinksByRel(jsonEntity.links, 'self');
    var url = link && link.href;
    if (url) {
      return self.siren.loadEntity(url, self);
    }
    return Promise.resolve(new Entity(self.siren, jsonEntity));
  });
  return Promise.all(children).then(function filterChildren(children) {
    return children.filter(filterFn || any)
  });
};

function filterLinksByRel(links, rel) {
  var link = links.filter(function (link) {
    return link.rel.indexOf(rel) != -1;
  });
  if (link.length > 1) {
    throw "Expected only one link with rel=" + rel;
  }
  return link.length === 0 ? undefined : link[0];
}