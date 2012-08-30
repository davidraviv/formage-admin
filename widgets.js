
var Class = require('sji')
    ,_ = require('underscore');

var Widget = exports.Widget = Class.extend({
    init:function(options)
    {
        this.options = options;
        this.limit = this.options.limit || 50;
        this.required = options.required || false;
        this.attrs = options.attrs || {};
        this.validators = options.validators || [];
        this.attrs = options.attrs || {};
        this.attrs.class = this.attrs.class || [];
        this.attrs.class.push(this.required ? 'required_label' : 'optional_label');
        this.data = options.data || {};
        this.name = '';
        this.value = null;
        options.static = options.static || {};
        this.static = {
            css:options.static.css || [],
            js:options.static.js || []
        };
    },
    pre_render : function(callback)
    {
        callback(null);
    },
    render : function(res)
    {
        return this;
    },
    render_attributes : function(res)
    {
        this.attrs['name'] = this.name;
        this.attrs['id'] = 'id_' + this.name;
        for(var attr in this.attrs) {
            var value = Array.isArray(this.attrs[attr]) ? this.attrs[attr].join(' ') : this.attrs[attr];
            res.write(' ' + attr + '="' + escape_html(value) + '"');
        }
        for(var attr in this.data) {
            var value = Array.isArray(this.data[attr]) ? this.data[attr].join(' ') : this.data[attr];
            res.write(' data-' + attr + '="' + escape_html(value) + '"');
        }
        return this;
    }
});

function escape_html(str)
{
    return (str + '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

var InputWidget = exports.InputWidget = Widget.extend({
	init: function(type,options)
    {
        options.attrs.type = options.attrs.type || type;
        this._super(options);
    },
    render : function(res)
    {
        res.write('<input value="' + escape_html(this.value != null ? this.value :  '') + '"');
        this.render_attributes(res);
        res.write(' />');
        return this;
    }
});

var HiddenWidget = exports.HiddenWidget = InputWidget.extend({
	init: function(options)
    {
        this._super('hidden',options);
    }
});

var TextWidget = exports.TextWidget = InputWidget.extend({
    init: function(options){
        this._super('text',options);
    }
});

var PasswordWidget = exports.PasswordWidget = InputWidget.extend({
    init: function(options)
    {
        this._super('password',options);
    }
});

var TextAreaWidget = exports.TextAreaWidget = Widget.extend({
    render : function(res)
    {
        res.write('<textarea ');
        this.render_attributes(res);
        res.write(' >');
        res.write(escape_html(this.value != null ? this.value :  ''));
        res.write('</textarea>');
        return this;
    }

});

var RichTextAreaWidget = exports.RichTextAreaWidget = TextAreaWidget.extend({
    init: function(options)
    {
        this._super(options);
        this.attrs.class.push('ckeditor');
        this.static.js.push('/node-forms/ckeditor/ckeditor.js');
    },
    render:function(res)
    {
        res.write('<div style="width:930px; padding-top:31px;">');
        this._super(res);
        res.write('</div>');
    }
});

var DateWidget = exports.DateWidget = InputWidget.extend({
	init: function(options)
    {
        this._super('text',options);
        this.attrs.class.push('nf_datepicker');
        this.static.js.push('/node-forms/js/jquery-ui-1.8.22.custom.min.js');
        this.static.js.push('/node-forms/js/jquery-ui-timepicker-addon.js');
        this.static.css.push('/node-forms/css/ui-lightness/jquery-ui-1.8.22.custom.css');
    }
});

var NumberWidget = exports.NumberWidget = InputWidget.extend({
	init: function(options)
    {
        options = options || {};
        options.attrs = options.attrs || {};
        if(options.min != null)
            options.attrs.min = options.min;
        if(options.max != null)
            options.attrs.max = options.max;
        options.attrs.step = options.attrs.step || options.step || 'any' ;
        this._super('number',options);
    }
});

var CheckboxWidget = exports.CheckboxWidget = InputWidget.extend({
	init: function(options)
    {
        this._super('checkbox',options);
    },
    render : function(res)
    {
        var old_value = this.value;
        if(this.value)
            this.attrs['checked'] = 'checked';
        this.value = 'on';
        var ret = this._super(res);
        this.value = old_value;
        return ret;

    }
});

var ChoicesWidget = exports.ChoicesWidget = Widget.extend({
	init: function(options)
    {
        this.choices = options.choices || [];
        this._super(options);
    },
    isSelected:function(choice) {
        if(Array.isArray(this.value))
            return _.include(this.value,choice);
        else
            return choice == this.value;
    },
    prepareValues: function(){
        if(!this.names) {
            this.names = new Array(this.choices.length);
            for(var i=0; i<this.choices.length; i++) {
                if(typeof(this.choices[i]) == 'object') {
                    this.names[i] = this.choices[i][1];
                    this.choices[i] = this.choices[i][0];
                }
                else
                    this.names[i] = this.choices[i];
            }
        }
    },
    render : function(res)
    {
        this.prepareValues();
        res.write('<select ');
        this.render_attributes(res);
        res.write(' >');
        var found_selected = false;
        if(!this.required)
        {
            var selected = this.value ? '' : 'selected="selected" ';
            if(selected)
                found_selected = true;
            res.write('<option ' + selected + 'value=""> ---- </option>');
        }
        for(var i=0; i<this.choices.length; i++)
        {
            var selected = this.isSelected(this.choices[i]) ? 'selected="selected" ' : '';
	    if(selected)
                found_selected = true;
            res.write('<option ' + selected + 'value="' + this.choices[i] + '">' + this.names[i] + '</option>');
        }
        if(!found_selected && this.value) {
            res.write('<option selected="selected" value="' + this.value + '">Current</option>');
        }
        res.write('</select>');
        return this;
    }
});

var RefWidget = exports.RefWidget = ChoicesWidget.extend({
	init: function(options)
    {
        this.ref = options.ref;
        if(!this.ref)
            throw new TypeError('model was not provided');
        this._super(options);
    },
    pre_render : function(callback)
    {
        var self = this;
        var base = self._super;
        this.ref.find({}).limit(self.limit).exec(function(err,objects)
        {
            if(err)
                callback(err);
            else
            {
                self.choices = [];
                for(var i=0; i<objects.length; i++)
                    self.choices.push([objects[i].id,objects[i].name || objects[i].title || objects[i].toString()]);
                return base(callback);
            }
        });
    }
});

//var UnknownRefWidget = exports.UnknownRefWidget = _extends(ChoicesWidget)
    
var ListWidget = exports.ListWidget = Widget.extend({
	init: function(options)
    {
        this._super(options);
    },
    render : function(res,render_template,render_item)
    {
        res.write("<div class='nf_listfield' name='" + this.name + "'><div class='nf_hidden_template'>");
        render_template(res);
        res.write('</div><ul>');
        this.value = this.value || [];
        for(var i=0; i<this.value.length; i++)
        {
            res.write('<li>');
            render_item(res,i);
            res.write('</li>');
        }
        res.write('</ul></div>');
    }
});

var FileWidget = exports.FileWidget = InputWidget.extend({
	init: function(options) {
        this._super('file', options);
    },
    render : function(res) {
        this._super(res);
        if(this.value && this.value.path)
            res.write('Clear<input type="checkbox" name="' + this.name +'_clear" value="Clear" /> <a href="' + this.value.url + '">' + this.value.path + '</a>');
    }
});

var MapWidget = exports.MapWidget = InputWidget.extend({
	init: function(options)
    {
        this._super('hidden',options);
        this.attrs.class.push('nf_mapview');
        this.static.js.push('//maps-api-ssl.google.com/maps/api/js?v=3&sensor=false&language=he&libraries=places');
        this.static.js.push('/node-forms/js/maps.js');
    },
    render : function(res)
    {
        if(!this.options.hide_address)
        {
            var address = this.value ? this.value.address : '';
            this.attrs['address_field'] = 'id_' + this.name + '_address';
            res.write('<input type="text" name="' + this.name +'_address" id="id_' + this.name + '_address" value="' + address + '" />');
        }
        var old_value = this.value;
        var lat = this.value && this.value.geometry ? this.value.geometry.lat : '';
        var lng = this.value && this.value.geometry ? this.value.geometry.lng : '';
        this.value = lat + ',' + lng;
        this._super(res);
        this.value = old_value;
    }
});



var ComboBoxWidget = exports.ComboBoxWidget = ChoicesWidget.extend({
    init: function(options)  {
        this._super(options);
        this.static = this.static || {};
        this.static.js = this.static.js || [];
        this.static.js.push('/node-forms/js/autocomplete.js');

        this.attrs.class.push('nf_combo');
    }
});


var AutocompleteWidget = exports.AutocompleteWidget = TextWidget.extend({
    init: function(options)  {
        options = options || {};
        this._super(options);
        this.static = this.static || {};
        this.static.js = this.static.js || [];
        this.static.js.push('/node-forms/js/autocomplete.js');

        this.attrs.class.push('nf_ref');



        if(!options.url)
            throw new Error('must specify url');

        this.data = this.data || {};
        this.data.url = this.data.url || options.url;
        this.data.data = this.data.data || options.data;

        this.ref = options.ref;
        if(!this.ref)
            throw new TypeError('model was not provided');
    },

    pre_render:function(callback) {
        var self = this;
        var base = this._super;
        var id = this.value;
        self.data['name'] = id || '';
        if(id) {
            var query;
            if(Array.isArray(id)) {
                id = id.filter(function(x) {return x;});
                query = this.ref.find().where('_id').in(id);
            } else
                query = this.ref.findById(id);
            query.exec(function(err,doc) {
                if(err)
                    callback(err);
                else {
                    if(doc)
                        self.doc = doc;
                    base.call(self,callback);
                }
            });
        }
        else
            base.call(self,callback);
    },

    render: function(res) {
        var self = this;
        var name = self.value;
        if(self.doc) {
            if(Array.isArray(this.doc)) {
                name = (_.find(this.doc,function(doc) {
                    return doc.id == self.value;
                }) || '').toString()
            }
            else
                name = self.doc.toString();
        }
        self.data.name = name || '';
        self._super(res);
    }


});

    
    
    
    
    