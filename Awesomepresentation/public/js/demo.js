// An example AV.js Backbone application based on the todo app by

// the todo items and provide user authentication and sessions.

$(function() {

    AV.$ = jQuery;
    AV.initialize("6m6u1pqsek4k7269sb0ef0llnglkwtr3kqcmsku697ajufqf",
        "69d3656sbgq9rupuz2lm7cselz5e1w78wso6foa5l0wt919t");

    // Todo Model
    // ----------

    // Our basic Todo model has `content`, `order`, and `done` attributes.
    var Todo = AV.Object.extend("Todo", {
        // Default attributes for the todo.
        defaults: {
            content: "start to build your own presentation",
            step: "step slide",
            dataX: "0",
            dataY: "0",
            dataZ: "0",
            dataRotateX: "0",
            dataRotateY: "0",
            dataRotateZ: "0",
            dataScale: "5",
            done: false
        },
        // Ensure that each todo created has `content`.
        initialize: function() {
            if (!this.get("content")) {
                this.set({
                    "content": this.defaults.content
                });
            }
        },

        // Toggle the `done` state of this todo item.
        toggle: function() {
            this.save({
                done: !this.get("done")
            });
        }
    });

    // This is the transient application state, not persisted on AV
    var AppState = AV.Object.extend("AppState", {
        defaults: {
            filter: "all"
        }
    });

    // Todo Collection
    // ---------------

    var TodoList = AV.Collection.extend({

        // Reference to this collection's model.
        model: Todo,

        // Filter down the list of all todo items that are finished.
        done: function() {
            return this.filter(function(todo) {
                return todo.get('done');
            });
        },

        // Filter down the list to only todo items that are still not finished.
        remaining: function() {
            return this.without.apply(this, this.done());
        },

        // We keep the Todos in sequential order, despite being saved by unordered
        // GUID in the database. This generates the next order number for new items.
        nextOrder: function() {
            if (!this.length) return 1;
            return this.last().get('order') + 1;
        },

        // Todos are sorted by their original insertion order.
        comparator: function(todo) {
            return todo.get('order');
        }

    });



    var LogInView = AV.View.extend({
        events: {
            "submit form.login-form": "logIn",
            "submit form.signup-form": "signUp"
        },

        el: ".body",

        initialize: function() {
            _.bindAll(this, "logIn", "signUp");
            this.render();
        },

        logIn: function(e) {
            var self = this;
            var username = this.$("#login-username").val();
            var password = this.$("#login-password").val();

            AV.User.logIn(username, password, {
                success: function(user) {
                    new ManageTodosView();
                    self.undelegateEvents();
                    delete self;
                },

                error: function(user, error) {
                    self.$(".login-form .error").html("Invalid username or password. Please try again.").show();
                    this.$(".login-form button").removeAttr("disabled");
                }
            });

            this.$(".login-form button").attr("disabled", "disabled");

            return false;
        },

        signUp: function(e) {
            var self = this;
            var username = this.$("#signup-username").val();
            var password = this.$("#signup-password").val();

            AV.User.signUp(username, password, {
                success: function(user) {
                    new ManageTodosView();
                    self.undelegateEvents();
                    delete self;
                },

                error: function(user, error) {
                    self.$(".signup-form .error").html(error.message).show();
                    this.$(".signup-form button").removeAttr("disabled");
                }
            });

            this.$(".signup-form button").attr("disabled", "disabled");

            return false;
        },

        render: function() {
            this.$el.html(_.template($("#login-template").html()));
            this.delegateEvents();
        }
    });
    var IuntiView = AV.View.extend({

        //... is a list tag.
        // className: 'step',
        // attributes: {
        //     'data-x':  function() { return this.model.get('dataX'); },
        //     'data-y': 15,
        //     'data-z': 0,
        //     'data-rotate-x': 10,
        //     'data-rotate-y': 1000,
        //     'data-rotate-z': 500,
        //     'data-scale': 0
        // },

        // Cache the template function for a single item.
        template: _.template($('#iunit-template').html()),

        // The DOM events specific to an item.
        events: {
           
        },

        // The TodoView listens for changes to its model, re-rendering. Since there's
        // a one-to-one correspondence between a Todo and a TodoView in this
        // app, we set a direct reference on the model for convenience.
        initialize: function() {
            _.bindAll(this, 'render',  'remove');
            this.model.bind('change', this.render);
            this.model.bind('destroy', this.remove);
        },

        // Re-render the contents of the todo item.
        render: function() {
            $(this.el).html(this.template(this.model.toJSON()));
            return this;
        },
    });

    // The Application
    // ---------------

    // The main view that lets a user manage their todo items
    var ImpressDemoView = AV.View.extend({


        // Delegated events for creating new items, and clearing completed ones.
        events: {
            "click .log-out": "logOut"
        },

        el: ".todoapp",

        // At initialization we bind to the relevant events on the `Todos`
        // collection, when items are added or changed. Kick things off by
        // loading any preexisting todos that might be saved to AV.
        initialize: function() {
            var self = this;

            _.bindAll(this, 'addOne', 'addAll', 'addSome', 'logOut');

            // Main todo management template
            this.$el.html(_.template($("#impress-demo-template").html()));

            this.input = this.$("#new-todo");
            this.allCheckbox = this.$("#toggle-all")[0];

            // Create our collection of Todos
            this.todos = new TodoList;

            // Setup the query for the collection to look for todos from the current user
            this.todos.query = new AV.Query(Todo);
            this.todos.query.equalTo("user", AV.User.current());

            this.todos.bind('add', this.addOne);
            this.todos.bind('reset', this.addAll);
            this.todos.bind('all', this.render);

            // Fetch all the todo items for this user
            this.todos.fetch();

            state.on("change", this.filter, this);
        },

        // Logs out the user and shows the login view
        logOut: function(e) {
            AV.User.logOut();
            new LogInView();
            this.undelegateEvents();
            delete this;
        },

        // Add a single todo item to the list by creating a view for it, an
        // appending its element to the `<ul>`.
        addOne: function(todo) {
            var view = new IuntiView({
                model: todo
            });
            var something =view.render().el;
            this.$("#impress").append(something.innerHTML);
            console.log(something.innerHTML);
            
        },

        // Add all items in the Todos collection at once.
        addAll: function(collection, filter) {
            this.$("#impress").html("");
            this.todos.each(this.addOne);
            $('#impress').append('<div id="overview" class="step" data-x="3000" data-y="1500" data-scale="10"></div>');
            $('#impress').append("<script>impress().init();</script>");
        },

        // Only adds some todos, based on a filtering function that is passed in
        addSome: function(filter) {
            var self = this;
            this.$("#impress").html("");
            this.todos.chain().filter(filter).each(function(item) {
                self.addOne(item)
            });
        }
    });




    // The main view for the app
    var AppView = AV.View.extend({
        // Instead of generating a new element, bind to the existing skeleton of
        // the App already present in the HTML.
        el: $("#todoapp"),

        initialize: function() {
            this.render();
        },

        render: function() {
            if (AV.User.current()) {
                new ImpressDemoView();

            } else {
                new LogInView();
            }
        }
    });

    var AppRouter = AV.Router.extend({
        routes: {
            "all": "all",
            "active": "active",
            "completed": "completed"
        },

        initialize: function(options) {},

        all: function() {
            state.set({
                filter: "all"
            });
        },

        active: function() {
            state.set({
                filter: "active"
            });
        },

        completed: function() {
            state.set({
                filter: "completed"
            });
        }
    });

    var state = new AppState;

    new AppRouter;
    new AppView;
    AV.history.start();
});
