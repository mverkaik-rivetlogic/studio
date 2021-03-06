/*******************************************************************************
 * Crafter Studio Web-content authoring solution
 *     Copyright (C) 2007-2013 Crafter Software Corporation.
 *
 *     This program is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     This program is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with this program.  If not, see <http://www.gnu.org/licenses/>.
 ******************************************************************************/
package org.craftercms.cstudio.alfresco.dm.to;

import java.util.List;

public class DmPasteItemTO {

    /** uri of this item **/
    protected String _uri;
    public String getUri() {
        return _uri;
    }
    public void setUri(String uri) {
        this._uri = uri;
    }

    /** is deep copy? **/
    protected boolean _deep;
    public boolean isDeep() {
        return _deep;
    }
    public void setDeep(boolean deep) {
        this._deep = deep;
    }

    /** a list of children **/
    protected List<DmPasteItemTO> _children;
    public List<DmPasteItemTO> getChildren() {
        return _children;
    }
    public void setChildren(List<DmPasteItemTO> children) {
        this._children = children;
    }
}
