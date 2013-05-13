/*
 * Copyright (C) 2007-2013 Crafter Software Corporation.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
package org.craftercms.cstudio.alfresco.dm.script;

import java.util.List;

import javolution.util.FastList;
import net.sf.json.JSONObject;

import org.alfresco.repo.processor.BaseProcessorExtension;
import org.alfresco.repo.publishing.PublishEventAction;
import org.alfresco.repo.publishing.PublishingEventProcessor;
import org.alfresco.service.cmr.publishing.PublishingDetails;
import org.alfresco.service.cmr.publishing.PublishingService;
import org.alfresco.service.cmr.publishing.channels.Channel;
import org.alfresco.service.cmr.publishing.channels.ChannelService;
import org.alfresco.service.cmr.repository.NodeRef;
import org.craftercms.cstudio.alfresco.dm.service.api.DmPublishService;
import org.craftercms.cstudio.alfresco.dm.service.api.DmTransactionService;
import org.craftercms.cstudio.alfresco.dm.util.DmUtils;
import org.craftercms.cstudio.alfresco.service.ServicesManager;
import org.craftercms.cstudio.alfresco.service.api.PersistenceManagerService;
import org.craftercms.cstudio.alfresco.service.api.ServicesConfig;
import org.craftercms.cstudio.alfresco.to.PublishingChannelTO;

public class DmPublishServiceScript extends BaseProcessorExtension {
    protected static final String workflowName = "activiti$publishWebContent";

    protected ServicesManager servicesManager;
    public ServicesManager getServicesManager() {
        return servicesManager;
    }
    public void setServicesManager(ServicesManager servicesManager) {
        this.servicesManager = servicesManager;
    }

    protected PublishEventAction _action;
    public PublishEventAction getAction() {
        return _action;
    }
    public void setAction(PublishEventAction action) {
        this._action = action;
    }

    protected PublishingEventProcessor _publishingEventProcessor;
    public PublishingEventProcessor getPublishingEventProcessor() {
        return _publishingEventProcessor;
    }
    public void setPublishingEventProcessor(PublishingEventProcessor publishingEventProcessor) {
        this._publishingEventProcessor = publishingEventProcessor;
    }


    public String publish(String site, String path) {
        PersistenceManagerService persistenceManagerService = getServicesManager().getService(PersistenceManagerService.class);
        ServicesConfig servicesConfig = getServicesManager().getService(ServicesConfig.class);
        Channel channel = persistenceManagerService.getChannelByName("New Crafter Studio File System Publishing Channel channel");
        String fullPath = servicesConfig.getRepositoryRootPath(site) + path;
        List<NodeRef> nodesToPublish = new FastList<NodeRef>();
        NodeRef nodeRef = persistenceManagerService.getNodeRef(fullPath);
        nodesToPublish.add(nodeRef);
        PublishingDetails publishingDetails = persistenceManagerService.createPublishingDetails();
        publishingDetails.addNodesToPublish(nodesToPublish);
        publishingDetails.setSchedule(null);
        publishingDetails.setPublishChannelId(channel.getId());
        String eventId = persistenceManagerService.scheduleNewEvent(publishingDetails);

        return "Success";
    }

    public String getAvailablePublishingChannelGroups(String site, String path) {
        DmPublishService dmPublishService = getServicesManager().getService(DmPublishService.class);
        List<PublishingChannelTO> channelsTO = dmPublishService.getAvailablePublishingChannelGroups(site, path);
        List<PublishingChannelTO> publishChannels = new FastList<PublishingChannelTO>();
        List<PublishingChannelTO> updateStatusChannels = new FastList<PublishingChannelTO>();
        for (PublishingChannelTO channelTO : channelsTO) {
            if (channelTO.isPublish()) {
                publishChannels.add(channelTO);
            }
            if (channelTO.isUpdateStatus()) {
                updateStatusChannels.add(channelTO);
            }
        }
        JSONObject jsonObject = new JSONObject();
        jsonObject.put("availablePublishChannels", publishChannels);
        jsonObject.put("availableUpdateStatusChannels", updateStatusChannels);
        return jsonObject.toString();
    }

}