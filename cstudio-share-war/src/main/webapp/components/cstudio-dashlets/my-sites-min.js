/**
 * Copyright (C) 2005-2010 Alfresco Software Limited.
 *
 * This file is part of Alfresco
 *
 * Alfresco is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Alfresco is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Alfresco. If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Dashboard MyCrafterSites component.
 *
 * @namespace Alfresco.dashlet
 * @class Alfresco.dashlet.MyCrafterSites
 */
(function()
{
   /**
    * YUI Library aliases
    */
   var Dom = YAHOO.util.Dom,
      Event = YAHOO.util.Event,
      Selector = YAHOO.util.Selector;

   /**
    * Alfresco Slingshot aliases
    */
   var $html = Alfresco.util.encodeHTML,
      $links = Alfresco.util.activateLinks;

   /**
    * Use the getDomId function to get some unique names for global event handling
    */
   var FAV_EVENTCLASS = Alfresco.util.generateDomId(null, "fav-site"),
      IMAP_EVENTCLASS = Alfresco.util.generateDomId(null, "imap-site"),
      LIKE_EVENTCLASS = Alfresco.util.generateDomId(null, "like-site"),
      DELETE_EVENTCLASS = Alfresco.util.generateDomId(null, "del-site");

   /**
    * Preferences
    */
   var PREFERENCES_SITES = "org.alfresco.share.craftersites",
      PREFERENCES_SITES_DASHLET_FILTER = PREFERENCES_SITES + ".dashlet.filter";

   /**
    * Dashboard MyCrafterSites constructor.
    *
    * @param {String} htmlId The HTML id of the parent element
    * @return {Alfresco.dashlet.MyCrafterSites} The new component instance
    * @constructor
    */
   Alfresco.dashlet.MyCrafterSites = function MyCrafterSites_constructor(htmlId)
   {
      Alfresco.dashlet.MyCrafterSites.superclass.constructor.call(this, "Alfresco.dashlet.MyCrafterSites", htmlId, ["datasource", "datatable", "animation"]);

      // Initialise prototype properties
      this.sites = [];
      this.createSite = null;

      // Services
      this.services.preferences = new Alfresco.service.Preferences();
      this.services.likes = new Alfresco.service.Ratings(Alfresco.service.Ratings.LIKES);

      // Listen for events from other components
      YAHOO.Bubbling.on("siteDeleted", this.onSiteDeleted, this);

      return this;
   };

   YAHOO.extend(Alfresco.dashlet.MyCrafterSites, Alfresco.component.Base,
   {
      /**
       * Site data
       *
       * @property sites
       * @type array
       */
      sites: null,

      /**
       * CreateSite module instance.
       *
       * @property createSite
       * @type Alfresco.module.CreateSite
       */
      createSite: null,

      /**
       * Object container for initialization options
       *
       * @property options
       * @type object
       */
      options:
      {
         /**
          * List of valid filters
          *
          * @property validFilters
          * @type object
          */
         validFilters:
         {
            "all": true,
            "favSites": true
         },
          
         /**
          * Flag if IMAP server is enabled
          *
          * @property imapEnabled
          * @type boolean
          * @default false
          */
         imapEnabled: false,
         
         /**
          * Result list size maximum
          *
          * @property listSize
          * @type integer
          * @default 100
          */
         listSize: 100
      },

      /**
       * Fired by YUI when parent element is available for scripting
       * @method onReady
       */
      onReady: function MyCrafterSites_onReady()
      {
         var me = this;

         // Create Dropdown filter
         this.widgets.type = Alfresco.util.createYUIButton(this, "type", this.onTypeFilterChanged,
         {
            type: "menu",
            menu: "type-menu",
            lazyloadmenu: false
         });

         // Listen on clicks for the create site link
         Event.addListener(this.id + "-createSite-button", "click", this.onCreateSite, this, true);

         // DataSource definition
         this.widgets.dataSource = new YAHOO.util.DataSource(this.sites,
         {
            responseType: YAHOO.util.DataSource.TYPE_JSARRAY
         });

         // DataTable column defintions
         var columnDefinitions =
         [
            { key: "icon", label: "Icon", sortable: false, formatter: this.bind(this.renderCellIcon), width: 52 },
            { key: "detail", label: "Description", sortable: false, formatter: this.bind(this.renderCellDetail) },
            { key: "actions", label: "Actions", sortable: false, formatter: this.bind(this.renderCellActions), width: 24 }
         ];

         // DataTable definition
         this.widgets.dataTable = new YAHOO.widget.DataTable(this.id + "-sites", columnDefinitions, this.widgets.dataSource,
         {
            MSG_EMPTY: this.msg("message.datatable.loading")
         });

         // Override abstract function within DataTable to set custom empty message
         this.widgets.dataTable.doBeforeLoadData = function MyCrafterSites_doBeforeLoadData(sRequest, oResponse, oPayload)
         {
            if ((oResponse.results.length === 0) || (oResponse.results.length === 1 && oResponse.results[0].shortName === "swsdp"))
            {
               oResponse.results.unshift(
               {
                  isInfo: true,
                  title: me.msg("empty.title"),
                  description: me.msg("empty.description") + (oResponse.results.length === 1 ? "<p>" + me.msg("empty.description.sample-site") + "</p>" : "")
               });
            }
            return true;
         };

         // Add animation to row delete
         this.widgets.dataTable._deleteTrEl = function MyCrafterSites__deleteTrEl(row)
         {
            var scope = this,
               trEl = this.getTrEl(row);

            var changeColor = new YAHOO.util.ColorAnim(trEl,
            {
               opacity:
               {
                  to: 0
               }
            }, 0.25);
            changeColor.onComplete.subscribe(function()
            {
               YAHOO.widget.DataTable.prototype._deleteTrEl.call(scope, row);
            });
            changeColor.animate();
         };

         /**
          * Hook favourite site events
          */
         var registerEventHandler = function MyCrafterSites_onReady_registerEventHandler(cssClass, fnHandler)
         {
            var fnEventHandler = function MyCrafterSites_onReady_fnEventHandler(layer, args)
            {
               var owner = YAHOO.Bubbling.getOwnerByTagName(args[1].anchor, "div");
               if (owner !== null)
               {
                  fnHandler.call(me, args[1].target.offsetParent, owner);
               }

               return true;
            };
            YAHOO.Bubbling.addDefaultAction(cssClass, fnEventHandler);
         };

         registerEventHandler(FAV_EVENTCLASS, this.onFavouriteSite);
         registerEventHandler(IMAP_EVENTCLASS, this.onImapFavouriteSite);
         registerEventHandler(LIKE_EVENTCLASS, this.onLikes);
         registerEventHandler(DELETE_EVENTCLASS, this.onDeleteSite);

         // Enable row highlighting
         this.widgets.dataTable.subscribe("rowMouseoverEvent", this.widgets.dataTable.onEventHighlightRow);
         this.widgets.dataTable.subscribe("rowMouseoutEvent", this.widgets.dataTable.onEventUnhighlightRow);

         // Load sites & preferences
         this.loadSites();
      },

      /**
       * Date drop-down changed event handler
       *
       * @method onTypeFilterChanged
       * @param p_sType {string} The event
       * @param p_aArgs {array}
       */
      onTypeFilterChanged: function MyCrafterSites_onTypeFilterChanged(p_sType, p_aArgs)
      {
         var menuItem = p_aArgs[1];
         if (menuItem)
         {
            this.widgets.type.set("label", menuItem.cfg.getProperty("text"));
            this.widgets.type.value = menuItem.value;

            // Save preferences and load sites afterwards
            this.services.preferences.set(PREFERENCES_SITES_DASHLET_FILTER, menuItem.value,
            {
               successCallback:
               {
                  fn: this.loadSites,
                  scope: this
               }
            });
         }
      },

      /**
       * Load sites list
       *
       * @method loadSites
       */
      loadSites: function MyCrafterSites_loadSites()
      {
         // Load sites
         Alfresco.util.Ajax.request(
         {
            url: Alfresco.constants.PROXY_URI + "api/people/" + encodeURIComponent(Alfresco.constants.USERNAME) + "/sites?roles=user&size=" + this.options.listSize,
            successCallback:
            {
               fn: this.onSitesLoaded,
               scope: this
            }
         });
      },

      /**
       * Retrieve user preferences after sites data has loaded
       *
       * @method onSitesLoaded
       * @param p_response {object} Response from "api/people/{userId}/sites" query
       */
      onSitesLoaded: function MyCrafterSites_onSitesLoaded(p_response)
      {
         // Load preferences (after which the appropriate sites will be displayed)
         this.services.preferences.request(PREFERENCES_SITES,
         {
            successCallback:
            {
               fn: this.onPreferencesLoaded,
               scope: this,
               obj: p_response.json
            }
         });
      },

      /**
       * Process response from sites and preferences queries
       *
       * @method onPreferencesLoaded
       * @param p_response {object} Response from "api/people/{userId}/preferences" query
       * @param p_items {object} Response from "api/people/{userId}/sites" query
       */
      onPreferencesLoaded: function MyCrafterSites_onPreferencesLoaded(p_response, p_items)
      {
         var favSites = {},
            imapfavSites = {},
            siteManagers, i, j, k, l,
            ii = 0;

         // Save preferences
         if (p_response.json.org)
         {
           try{ p_items[i].isFavourite = typeof(favSites[p_items[i].shortName]) == "undefined" ? false : favSites[p_items[i].shortName];
            favSites = p_response.json.org.alfresco.share.sites.favourites;
            imapfavSites = p_response.json.org.alfresco.share.sites.imapFavourites;
 
            }
            catch(err) {
            }
 
         }

         // Select the preferred filter in the ui
         var filter = Alfresco.util.findValueByDotNotation(p_response.json, PREFERENCES_SITES_DASHLET_FILTER, "all");
         filter = this.options.validFilters.hasOwnProperty(filter) ? filter : "all";

         this.widgets.type.set("label", this.msg("filter." + filter));
         
         this.widgets.type.value = filter;

         // Display the toolbar now that we have selected the filter
         Dom.removeClass(Selector.query(".toolbar div", this.id, true), "hidden");

         for (i = 0, j = p_items.length; i < j; i++)
         {
            p_items[i].isSiteManager = p_items[i].siteRole === "SiteManager";
            p_items[i].isFavourite = typeof(favSites[p_items[i].shortName]) == "undefined" ? false : favSites[p_items[i].shortName];
            if (imapfavSites)
            {
               p_items[i].isIMAPFavourite = typeof(imapfavSites[p_items[i].shortName]) == "undefined" ? false : imapfavSites[p_items[i].shortName];
            }
         }

         this.sites = [];
         for (i = 0, j = p_items.length; i < j; i++)
         {
            var site = YAHOO.lang.merge({}, p_items[i]);

            if (this.filterAccept(this.widgets.type.value, site))
            {
               this.sites[ii] = site;
               ii++;
            }
         }

         this.sites.sort(function(a, b)
         {
            var name1 = a.title ? a.title.toLowerCase() : a.shortName.toLowerCase(),
                name2 = b.title ? b.title.toLowerCase() : b.shortName.toLowerCase();
            return (name1 > name2) ? 1 : (name1 < name2) ? -1 : 0;
         });

         var successHandler = function MyCrafterSites_onSitesUpdate_success(sRequest, oResponse, oPayload)
         {
            oResponse.results=this.sites;
            this.widgets.dataTable.onDataReturnInitializeTable.call(this.widgets.dataTable, sRequest, oResponse, oPayload);
         };

         this.widgets.dataSource.sendRequest(this.sites,
         {
            success: successHandler,
            scope: this
         });
      },

      /**
       * Determine whether a given site should be displayed or not depending on the current filter selection
       * @method filterAccept
       * @param filter {string} Filter to set
       * @param site {object} Site object literal
       * @return {boolean}
       */
      filterAccept: function MyCrafterSites_filterAccept(filter, site)
      {
      	 if(site.sitePreset != "cstudio-site-dashboard") 
      	 	return false
      	 
         switch (filter)
         {
            case "all":
               return true;

            case "favSites":
               return (site.isFavourite || (this.options.imapEnabled && site.isIMAPFavourite));
         }
         return false;
      },

      /**
       * Generate "Favourite" UI
       *
       * @method generateFavourite
       * @param record {object} DataTable record
       * @return {string} HTML mark-up for Favourite UI
       */
      generateFavourite: function MyCrafterSites_generateFavourite(record)
      {
         var html = "";

         if (record.getData("isFavourite"))
         {
            html = '<a class="favourite-action ' + FAV_EVENTCLASS + ' enabled" title="' + this.msg("favourite.site.remove.tip") + '" tabindex="0"></a>';
         }
         else
         {
            html = '<a class="favourite-action ' + FAV_EVENTCLASS + '" title="' + this.msg("favourite.site.add.tip") + '" tabindex="0">' + this.msg("favourite.site.add.label") + '</a>';
         }

         return html;
      },

      /**
       * Generate "IMAP Favourite" UI
       *
       * @method generateIMAPFavourite
       * @param record {object} DataTable record
       * @return {string} HTML mark-up for Favourite UI
       */
      generateIMAPFavourite: function MyCrafterSites_generateIMAPFavourite(record)
      {
         var html = "";

         if (record.getData("isIMAPFavourite"))
         {
            html = '<a class="favourite-action favourite-imap ' + IMAP_EVENTCLASS + ' enabled" title="' + this.msg("favourite.imap-site.remove.tip") + '" tabindex="0"></a>';
         }
         else
         {
            html = '<a class="favourite-imap ' + IMAP_EVENTCLASS + '" title="' + this.msg("favourite.imap-site.add.tip") + '" tabindex="0">' + this.msg("favourite.imap-site.add.label") + '</a>';
         }

         return html;
      },

      /**
       * Generate "Likes" UI
       *
       * @method generateLikes
       * @param record {object} DataTable record
       * @return {string} HTML mark-up for Likes UI
       */
      generateLikes: function MyCrafterSites_generateLikes(record)
      {
         var likes = record.getData("likes"),
            html = "";

         // TODO: Remove when Site Service supports "Likes"
         likes = YAHOO.lang.merge(
         {
            isLiked: false,
            totalLikes: 0
         }, likes || {});
         
         if (likes.isLiked)
         {
            html = '<a class="like-action ' + LIKE_EVENTCLASS + ' enabled" title="' + this.msg("like.site.remove.tip") + '" tabindex="0"></a>';
         }
         else
         {
            html = '<a class="like-action ' + LIKE_EVENTCLASS + '" title="' + this.msg("like.site.add.tip") + '" tabindex="0">' + this.msg("like.site.add.label") + '</a>';
         }

         html += '<span class="likes-count">' + $html(likes.totalLikes) + '</span>';

         return html;
      },

      /**
       * Icon custom datacell formatter
       *
       * @method renderCellIcon
       * @param elCell {object}
       * @param oRecord {object}
       * @param oColumn {object}
       * @param oData {object|string}
       */
      renderCellIcon: function MyCrafterSites_renderCellIcon(elCell, oRecord, oColumn, oData)
      {
         Dom.setStyle(elCell, "width", oColumn.width + "px");
         Dom.setStyle(elCell.parentNode, "width", oColumn.width + "px");
         
         var site = oRecord.getData(),
            img = site.isInfo ? "crafter-web.png" : "crafter-web.png";

         elCell.innerHTML = '<img width="40px" height="40px" src="' + Alfresco.constants.URL_RESCONTEXT + 'themes/cstudioTheme/images/' + img + '" />';
      },

      /**
       * Name & description custom datacell formatter
       *
       * @method renderCellDetail
       * @param elCell {object}
       * @param oRecord {object}
       * @param oColumn {object}
       * @param oData {object|string}
       */
      renderCellDetail: function MyCrafterSites_renderCellDetail(elCell, oRecord, oColumn, oData)
      {
         var site = oRecord.getData(),
            description = '<span class="faded">' + this.msg("details.description.none") + '</span>',
            desc = "";

         if (site.isInfo)
         {
            desc += '<div class="empty"><h3>' + site.title + '</h3>';
            desc += '<span>' + site.description + '</span></div>';
         }
         else
         {
            // Description non-blank?
            if (site.description && site.description !== "")
            {
               description = $links($html(site.description));
            }

            desc += '<h3 class="site-title"><a href="' + Alfresco.constants.URL_PAGECONTEXT + 'site/' + site.shortName + '/dashboard" class="theme-color-1">' + $html(site.title) + '</a></h3>';
            desc += '<div class="detail"><span>' + description + '</span></div>';

            /* Favourite / IMAP / (Likes) */

            desc += '</div>';
         }

         elCell.innerHTML = desc;
      },

      /**
       * Actions custom datacell formatter
       *
       * @method renderCellActions
       * @param elCell {object}
       * @param oRecord {object}
       * @param oColumn {object}
       * @param oData {object|string}
       */
      renderCellActions: function MyCrafterSites_renderCellActions(elCell, oRecord, oColumn, oData)
      {
         Dom.setStyle(elCell, "width", oColumn.width + "px");
         Dom.setStyle(elCell.parentNode, "width", oColumn.width + "px");

         var desc = "";

         if (oRecord.getData("isSiteManager"))
         {
            desc += '<a class="delete-site ' + DELETE_EVENTCLASS + '" title="' + this.msg("link.deleteSite") + '">&nbsp;</a>';
         }
         elCell.innerHTML = desc;
      },

      /**
       * Adds an event handler for bringing up the delete site dialog for the specific site
       *
       * @method onDeleteSite
       * @param row {object} DataTable row representing site to be actioned
       */
      onDeleteSite: function MyCrafterSites_onDeleteSite(row)
      {
         var record = this.widgets.dataTable.getRecord(row);

         // Display the delete dialog for the site
         Alfresco.module.getDeleteCrafterSiteInstance().show(
         {
            site: record.getData()
         });
      },

      /**
       * Fired by DeleteSite module when a site has been deleted.
       *
       * @method onSiteDeleted
       * @param layer {object} Event fired (unused)
       * @param args {array} Event parameters (unused)
       */
      onSiteDeleted: function MyCrafterSites_onSiteDeleted(layer, args)
      {
         var site = args[1].site,
            siteId = site.shortName;

         // Find the record corresponding to this site
         var record = this._findRecordByParameter(siteId, "shortName");
         if (record !== null)
         {
            this.widgets.dataTable.deleteRow(record);
         }
      },

      /**
       * Adds an event handler that adds or removes the site as favourite site
       *
       * @method onFavouriteSite
       * @param row {object} DataTable row representing site to be actioned
       */
      onFavouriteSite: function MyCrafterSites_onFavouriteSite(row)
      {
         var record = this.widgets.dataTable.getRecord(row),
            site = record.getData(),
            siteId = site.shortName;

         site.isFavourite = !site.isFavourite;

         this.widgets.dataTable.updateRow(record, site);

         // Assume the call will succeed, but register a failure handler to replace the UI state on failure
         var responseConfig =
         {
            failureCallback:
            {
               fn: function MyCrafterSites_onFavouriteSite_failure(event, obj)
               {
                  // Reset the flag to it's previous state
                  var record = obj.record,
                     site = record.getData();

                  site.isFavourite = !site.isFavourite;
                  this.widgets.dataTable.updateRow(record, site);
                  Alfresco.util.PopupManager.displayPrompt(
                  {
                     text: this.msg("message.save.failure")
                  });
               },
               scope: this,
               obj:
               {
                  record: record
               }
            },
            successCallback:
            {
               fn: function MyCrafterSites_onFavouriteSite_success(event, obj)
               {
                  var record = obj.record,
                     site = record.getData();

                  YAHOO.Bubbling.fire(site.isFavourite ? "favouriteSiteAdded" : "favouriteSiteRemoved", site);
               },
               scope: this,
               obj:
               {
                  record: record
               }
            }
         };

         this.services.preferences.set(Alfresco.service.Preferences.FAVOURITE_SITES + "." + siteId, site.isFavourite, responseConfig);
      },

      /**
       * Adds an event handler that adds or removes the site as favourite site
       *
       * @method onImapFavouriteSite
       * @param row {object} DataTable row representing site to be actioned
       */
      onImapFavouriteSite: function MyCrafterSites_onImapFavouriteSite(row)
      {
         var record = this.widgets.dataTable.getRecord(row),
            site = record.getData(),
            siteId = site.shortName;

         site.isIMAPFavourite = !site.isIMAPFavourite;

         this.widgets.dataTable.updateRow(record, site);

         // Assume the call will succeed, but register a failure handler to replace the UI state on failure
         var responseConfig =
         {
            failureCallback:
            {
               fn: function MyCrafterSites_onImapFavouriteSite_failure(event, obj)
               {
                  // Reset the flag to it's previous state
                  var record = obj.record,
                     site = record.getData();

                  site.isIMAPFavourite = !site.isIMAPFavourite;
                  this.widgets.dataTable.updateRow(record, site);
                  Alfresco.util.PopupManager.displayPrompt(
                  {
                     text: this.msg("message.save.failure")
                  });
               },
               scope: this,
               obj:
               {
                  record: record
               }
            }
         };

         this.services.preferences.set(Alfresco.service.Preferences.IMAP_FAVOURITE_SITES + "." + siteId, site.isIMAPFavourite, responseConfig);
      },

      /**
       * Like/Unlike event handler
       *
       * @method onLikes
       * @param row {HTMLElement} DOM reference to a TR element (or child thereof)
       */
      onLikes: function MyCrafterSites_onLikes(row)
      {
         var record = this.widgets.dataTable.getRecord(row),
            site = record.getData(),
            nodeRef = new Alfresco.util.NodeRef(site.nodeRef),
            likes = site.likes;

         likes.isLiked = !likes.isLiked;
         likes.totalLikes += (likes.isLiked ? 1 : -1);

         var responseConfig =
         {
            successCallback:
            {
               fn: function MyCrafterSites_onLikes_success(event, p_nodeRef)
               {
                  var data = event.json.data;
                  if (data)
                  {
                     // Update the record with the server's value
                     var record = this._findRecordByParameter(p_nodeRef, "nodeRef"),
                        site = record.getData(),
                        likes = site.likes;

                     likes.totalLikes = data.ratingsCount;
                     this.widgets.dataTable.updateRow(record, site);
                  }
               },
               scope: this,
               obj: nodeRef.toString()
            },
            failureCallback:
            {
               fn: function MyCrafterSites_onLikes_failure(event, p_nodeRef)
               {
                  // Reset the flag to it's previous state
                  var record = this._findRecordByParameter(p_nodeRef, "nodeRef"),
                     site = record.getData(),
                     likes = site.likes;

                  likes.isLiked = !likes.isLiked;
                  likes.totalLikes += (likes.isLiked ? 1 : -1);
                  this.widgets.dataTable.updateRow(record, site);
                  Alfresco.util.PopupManager.displayPrompt(
                  {
                     text: this.msg("message.save.failure", site.title)
                  });
               },
               scope: this,
               obj: nodeRef.toString()
            }
         };

         if (likes.isLiked)
         {
            this.services.likes.set(nodeRef, 1, responseConfig);
         }
         else
         {
            this.services.likes.remove(nodeRef, responseConfig);
         }
         this.widgets.dataTable.updateRow(record, site);
      },

      /**
       * Fired by YUI Link when the "Create site" label is clicked
       * @method onCreateSite
       * @param event {domEvent} DOM event
       */
      onCreateSite: function MyCrafterSites_onCreateSite(event)
      {
         Alfresco.module.getCreateCrafterSiteInstance().show();
         Event.preventDefault(event);
      },

      /**
       * Searches the current recordSet for a record with the given parameter value
       *
       * @method _findRecordByParameter
       * @param p_value {string} Value to find
       * @param p_parameter {string} Parameter to look for the value in
       */
      _findRecordByParameter: function MyCrafterSites__findRecordByParameter(p_value, p_parameter)
      {
        var recordSet = this.widgets.dataTable.getRecordSet();
        for (var i = 0, j = recordSet.getLength(); i < j; i++)
        {
           if (recordSet.getRecord(i).getData(p_parameter) === p_value)
           {
              return recordSet.getRecord(i);
           }
        }
        return null;
      }
   });
})();