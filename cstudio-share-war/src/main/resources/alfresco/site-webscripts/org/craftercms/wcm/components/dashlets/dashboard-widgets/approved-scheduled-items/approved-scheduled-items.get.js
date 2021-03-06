<import resource="classpath:alfresco/site-webscripts/org/craftercms/common/lib/common-server-api.js">

var siteId = CStudioAuthoring.Service.determineShareSite(page.url.templateArgs);
var role = CStudioAuthoring.Service.determineAuthoringRoleForUser(siteId, user.id);

model.previewServerBaseUrl = CStudioAuthoring.Service.determinePreviewServer(siteId);
model.widgetId = "approvedScheduledItems";
model.widgetName = "Approved Scheduled Items";
model.widgetVisible = true;
model.showTotalRecordCount = true;
model.enableSetResultLimit = false;
model.collapsible=true;
