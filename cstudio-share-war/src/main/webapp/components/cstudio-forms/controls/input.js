CStudioForms.Controls.Input = CStudioForms.Controls.Input ||  
function(id, form, owner, properties, constraints, readonly)  {
	this.owner = owner;
	this.owner.registerField(this);
	this.errors = []; 
	this.properties = properties;
	this.constraints = constraints;
	this.inputEl = null;
	this.countEl = null;
	this.required = false;
	this.value = "_not-set";
	this.form = form;
	this.id = id;
	this.readonly = readonly;
	
	return this;
}

YAHOO.extend(CStudioForms.Controls.Input, CStudioForms.CStudioFormField, {

    getLabel: function() {
        return "Input";
    },

	_onChange: function(evt, obj) {
		obj.value = obj.inputEl.value;
		
		if(obj.required) {
			if(obj.inputEl.value == "") {
				obj.setError("required", "Field is Required");
				obj.renderValidation(true, false);
			}
			else {
				obj.clearError("required");
				obj.renderValidation(true, true);
			}
		}
		else {
			obj.renderValidation(false, true);
		}			

		obj.owner.notifyValidation();
		obj.form.updateModel(obj.id, obj.getValue());
	},

	/**
	 * perform count calculation on keypress
	 * @param evt event
	 * @param el element
	 */
	count: function(evt, countEl, el) {
		// 'this' is the input box
	    el = (el) ? el : this;
	    var text = el.value;
	    
	    var charCount = ((text.length) ? text.length : ((el.textLength) ? el.textLength : 0));
	    var maxlength = (el.maxlength && el.maxlength != '') ? el.maxlength : -1;
	    
	    if(maxlength != -1) {
		    if (charCount > el.maxlength) {
				// truncate if exceeds max chars
				if (charCount > el.maxlength) {
				  this.value = text.substr (0, el.maxlength);
				  charCount = el.maxlength;
			    }
	      
	      		
				if (evt && evt != null
				&& evt.keyCode!=8 && evt.keyCode!=46 && evt.keyCode!=37
				&& evt.keyCode!=38 && evt.keyCode!=39 && evt.keyCode!=40	// arrow keys
				&& evt.keyCode!=88 && evt.keyCode !=86) {					// allow backspace and
																			// delete key and arrow keys (37-40)
																			// 86 -ctrl-v, 90-ctrl-z,
	          		if(evt)
	          			YAHOO.util.Event.stopEvent(evt);
	       		}
			}
	    }
	    
        if (maxlength != -1) {
        	countEl.innerHTML = charCount + ' / ' + el.maxlength;
        } 
        else {
        	countEl.innerHTML = charCount;
        }
    },
    	
	render: function(config, containerEl) {
		// we need to make the general layout of a control inherit from common
		// you should be able to override it -- but most of the time it wil be the same
			containerEl.id = this.id;

		var titleEl = document.createElement("span");
			YAHOO.util.Dom.addClass(titleEl, 'label');
  		    YAHOO.util.Dom.addClass(titleEl, 'cstudio-form-field-title');
			titleEl.innerHTML = config.title;
		
		var controlWidgetContainerEl = document.createElement("div");
		YAHOO.util.Dom.addClass(controlWidgetContainerEl, 'cstudio-form-control-input-container');

		var validEl = document.createElement("span");
			YAHOO.util.Dom.addClass(validEl, 'validation-hint');
			YAHOO.util.Dom.addClass(validEl, 'cstudio-form-control-validation');
			controlWidgetContainerEl.appendChild(validEl);

		var inputEl = document.createElement("input");
			this.inputEl = inputEl;
			YAHOO.util.Dom.addClass(inputEl, 'datum');
			YAHOO.util.Dom.addClass(inputEl, 'cstudio-form-control-input');
			inputEl.value = (this.value = "_not-set") ? config.defaultValue : this.value;
			controlWidgetContainerEl.appendChild(inputEl);

			YAHOO.util.Event.on(inputEl, 'focus', function(evt, context) { context.form.setFocusedField(context) }, this);
			
			YAHOO.util.Event.on(inputEl, 'change', this._onChange, this);
			YAHOO.util.Event.on(inputEl, 'blur', this._onChange, this);
			
		for(var i=0; i<config.properties.length; i++) {
			var prop = config.properties[i];

			if(prop.name == "size") {
				inputEl.size = prop.value;
			}

			if(prop.name == "maxlength") {
				inputEl.maxlength = prop.value;
			}
			
			if(prop.name == "readonly" && prop.value == "true"){
				this.readonly = true;
			}
		}
		
			if(this.readonly == true){
				inputEl.disabled = true;
			}

		var countEl = document.createElement("div");
			YAHOO.util.Dom.addClass(countEl, 'char-count');
			YAHOO.util.Dom.addClass(countEl, 'cstudio-form-control-input-count');
			controlWidgetContainerEl.appendChild(countEl);
			this.countEl = countEl;
			
			
		YAHOO.util.Event.on(inputEl, 'keyup', this.count, countEl);
		YAHOO.util.Event.on(inputEl, 'keypress', this.count, countEl);
		YAHOO.util.Event.on(inputEl, 'mouseup', this.count, countEl);

		this.renderHelp(config, controlWidgetContainerEl);
		
		var descriptionEl = document.createElement("span");
			YAHOO.util.Dom.addClass(descriptionEl, 'description');
			YAHOO.util.Dom.addClass(descriptionEl, 'cstudio-form-field-description');
			descriptionEl.innerHTML = config.description;

		containerEl.appendChild(titleEl);
		containerEl.appendChild(controlWidgetContainerEl);
		containerEl.appendChild(descriptionEl);
	},

	getValue: function() {
		return this.value;
	},
	
	setValue: function(value) {
		this.value = value;
		this.inputEl.value = value;
		this.count(null, this.countEl, this.inputEl);
		this._onChange(null, this);
	},
	
	getName: function() {
		return "input";
	},
	
	getSupportedProperties: function() {
		return [
			{ label: "Display Size", name: "size", type: "int", defaultValue: "50" },
			{ label: "Max Length", name: "maxlength", type: "int",  defaultValue: "50" },
			{ label: "Readonly", name: "readonly", type: "boolean" },
			];
	},

	getSupportedConstraints: function() {
		return [
			{ label: "Required", name: "required", type: "boolean" },
		];
	}

});


CStudioAuthoring.Module.moduleLoaded("cstudio-forms-controls-input", CStudioForms.Controls.Input);