/*
 * Copyright (C) 2012 Atol Conseils et Développements.
 * http://www.atolcd.com/
 * Author: Bertrand FOREST
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

package com.atolcd.repo.jscript;

import org.alfresco.repo.jscript.BaseScopableProcessorExtension;
import org.alfresco.repo.security.authentication.AuthenticationUtil;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.Scriptable;
import org.springframework.extensions.surf.util.I18NUtil;

public class EventSchedulingUtils extends BaseScopableProcessorExtension {
	public String getMessage(String messageKey) {
		return I18NUtil.getMessage(messageKey);
	}

	public String getMessage(String messageKey, Object... params) {
		return I18NUtil.getMessage(messageKey, params);
	}

	public Object runAsSystem(final Function runAsWork) {
		return runAsSystem(runAsWork, AuthenticationUtil.getSystemUserName());
	}

	public Object runAsSystem(final Function runAsWork, String userName) {
		return AuthenticationUtil.runAs(new AuthenticationUtil.RunAsWork<Object>() {
			public Object doWork() throws Exception {
				Scriptable scope = runAsWork.getParentScope();
				return runAsWork.call(Context.getCurrentContext(), scope, scope, new Object[0]);
			}
		}, userName);
	}
}
