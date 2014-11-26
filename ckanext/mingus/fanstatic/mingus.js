//
// omg.js
//

// CKAN Querybuilder example application
//

// Coding begins
(function(context, namespace){

    // Begin basic JS improvements

    function definedp(that){
        return typeof that !='undefined';
    }

    $.fn.hasAttr = function(name) {
        return this.attr(name) !== undefined;
    };

    // case insensitive text search
    $.expr[':']['icontains'] = function(node, index, props){
        return node.innerText.upper().search(props[3].upper()) !== -1;
    }

    String.prototype.capitalize = function() {
        return this.charAt(0).upper() + this.slice(1);
    }

    String.prototype.chomp = function() {
        return this.trim();
    }
    String.prototype.upper = function() {
        return this.toUpperCase();
    }

    // End Js basics

    // Begin application
    var Mingus = context[namespace] = {
        backbone:    {},
        models:      {},
        collections: {},
        views:       {},
        widgets:     {},
        templates:   {},

        // State
        db: {},

        // Configurations
        config: {
            ckan_url: '/'
        },
        
        initialize: function(opts){
            this.config = _.extend(this.config, opts);
            this.ckan = new CKAN.Client(this.config.ckan_url);

            // Set up views 
            this.package_list = new Mingus.views.PackageListView();
            this.querybuilder = new Mingus.views.QueryBuilder();
            this.results = new Mingus.views.QueryResults();
            // Fire for initial data now the views have registered event handlers
            this.get_packages();
            return
        }
    };

    _.extend(Mingus, Backbone.Events);

    // Editor setup.
    var langTools = ace.require("ace/ext/language_tools");

    var packageCompleter = {
        getCompletions: function(editor, session, pos, prefix, callback) {
            if (prefix.length === 0 || !Mingus.db.package_list) { callback(null, []); return }
            var filtered = 
            callback(null,
                     _.map(
                         _.filter(Mingus.db.package_list, function(p){return p.indexOf(prefix) == 0}),
                                  function(p){
                                      return {name: p, value: p, meta: "CKAN Dataset"}
                                  }                         
                     )
                    );
        }
    }
    langTools.addCompleter(packageCompleter);
    // End editor setup
        
    Mingus.get_packages = function(){
	$.when(
            Mingus.ckan.action('current_package_list_with_resources'),
	    Mingus.ckan.datastoreResources()
	).done(
	    function(packages, datastore_resources){
		Mingus.db.datastore_resources = _.pluck(datastore_resources.result.records, 'name');
		Mingus.db.package_list = packages.result;
		_.each(Mingus.db.package_list, function(dataset){
		    dataset.datastore_resources = [];
		    _.each(dataset.resources, function(resource){
			if(Mingus.db.datastore_resources.indexOf(resource.id) != -1){
			    dataset.datastore_resources.push(resource);
			}
		    });
		});
		Mingus.trigger('package_list:reset')
	    }
        );
    };

    Mingus.views.PackageListView = Backbone.View.extend({
        
        el: '.package_list',

        template: _.template($('#package_list_tpl').html()),

        events: {
            'click .dataset_title':   'toggle_dataset',
            'click .insert_resource': 'insert_resource'
        },
        
        initialize: function(opts){
            _.bindAll(this, 'render', 'toggle_dataset', 'insert_resource');
            this.render();
            Mingus.on('package_list:reset', this.render);
        },
        
        render: function(){
            if(!Mingus.db.package_list){
                return;
            }
            this.$el.html(this.template({packages: Mingus.db.package_list}));
            return this;
        },

        toggle_dataset: function(event){
            var resources = $(event.target).next('div');
            resources.toggleClass('hidden');
        },

        insert_resource: function(event){
            var button = $(event.target);
            if(event.target.tagName == "I"){
                button = button.parent()
            }
            var dataset = _.find(Mingus.db.package_list, function(p){
                return p.id == button.data('dataset-id');
            });
            var resource = _.find(dataset.resources, function(r){
                return r.id == button.data('resource-id')
            });
            // Disable this for now until we write a pre-execute parser.
            // Mingus.trigger('editor:insert', dataset.name + '."' + resource.name + '"')
            Mingus.trigger('editor:insert', '"' + resource.id + '"');
            return;
        }

    });

    Mingus.views.QueryBuilder = Backbone.View.extend({
        
        el: '#querybuilder',

        events: {
            'click .execute': 'on_execute'
        },

        initialize: function(opts){
            _.bindAll(this, 'on_insert', 'on_execute');
            
            this.editor = ace.edit("editor");
            this.editor.setOptions({
                enableBasicAutocompletion: true,
            });
            this.editor.setTheme("ace/theme/monokai");
            this.editor.getSession().setMode("ace/mode/sql");
            this.editor.commands.addCommand({
                name: 'execute',
                bindKey: {win: 'Shift-Enter',  mac: 'Command-Enter'},
                exec: this.on_execute
            });
            this.editor.setValue('');

            Mingus.on('editor:insert', this.on_insert);
        },

        on_insert: function(text){
            this.editor.insert(text);
        },

	// 
	// Execute that query please !
	//
        on_execute: function(){
            Mingus.ckan.datastoreSqlQuery(this.editor.getValue()).then(
	        function(result){
		    Mingus.db.result = result;
                    Mingus.trigger('results');
		},
		function(err){
                    alert(err.message)
                }
	    );
	}               
    });

    Mingus.views.QueryResults = Backbone.View.extend({

        el: '#query_results',

        initialize: function(opts){
            _.bindAll(this, 'render');
            Mingus.on('results', this.render);
        },

        render: function(){
            if(!Mingus.db.result){
                return;
            }
            var model = new recline.Model.Dataset({
                fields: Mingus.db.result.fields,
                records: Mingus.db.result.hits
            });

	    var $multiview = this.$el.find('.multiview');
	    this.view = this._makeMultiView(model, $multiview);
            return this;
	},
	    
	_makeMultiView: function(dataset, $el) {
	    var gridView = {
		id: 'grid',
		label: 'Grid',
		view: new recline.View.Grid({
		    model: dataset,
		    state: {
			fitColumns: true
		    }
		})
	    };
	    var graphView = {
		id: 'graph',
		label: 'Graph',
		view: new recline.View.Flot({
		    model: dataset
		})
	    };
	    view = new recline.View.MultiView({
		model: dataset,
		views: [gridView, graphView],
		sidebarViews: [],
		el: $el
	    });
	    return view;
	},  

    });
    
})(this.window||exports, "Mingus")

    // var $el = $('#mygrid');
    // console.log($el);

    // var $el = $('#mygraph');
    // var graph = new recline.View.Graph({
    //     model: dataset,
    //     state: {
    //         group: "date",
    //         series: ["x", "z"]
    //     }
    // });
    // $el.append(graph.el);
    // graph.render();
    // graph.redraw();
