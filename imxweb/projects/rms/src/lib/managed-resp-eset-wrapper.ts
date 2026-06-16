/*
 * ONE IDENTITY LLC. PROPRIETARY INFORMATION
 *
 * This software is confidential.  One Identity, LLC. or one of its affiliates or
 * subsidiaries, has supplied this software to you under terms of a
 * license agreement, nondisclosure agreement or both.
 *
 * You may not copy, disclose, or use this software except in accordance with
 * those terms.
 *
 *
 * Copyright 2025 One Identity LLC.
 * ALL RIGHTS RESERVED.
 *
 * ONE IDENTITY LLC. MAKES NO REPRESENTATIONS OR
 * WARRANTIES ABOUT THE SUITABILITY OF THE SOFTWARE,
 * EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
 * TO THE IMPLIED WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE, OR
 * NON-INFRINGEMENT.  ONE IDENTITY LLC. SHALL NOT BE
 * LIABLE FOR ANY DAMAGES SUFFERED BY LICENSEE
 * AS A RESULT OF USING, MODIFYING OR DISTRIBUTING
 * THIS SOFTWARE OR ITS DERIVATIVES.
 *
 */

import {
  PortalPersonRolemembershipsEset,
  PortalPersonRolemembershipsEsetWrapper,
  PortalRespEset,
  PortalRespEsetInteractiveWrapper,
  PortalRespEsetWrapper,
  portal_person_rolememberships_ESet_get_args,
  portal_resp_eset_get_args,
} from '@imx-modules/imx-api-rms';
import { CollectionLoadParameters, EntitySchema, ExtendedTypedEntityCollection } from '@imx-modules/imx-qbm-dbts';
import { imx_SessionService } from 'qbm';

export class ManagedRespEsetWrapper {
  constructor(
    private readonly resp: PortalRespEsetWrapper,
    private readonly interactiveResp: PortalRespEsetInteractiveWrapper,
    private readonly memberships: PortalPersonRolemembershipsEsetWrapper,
    private readonly session: imx_SessionService,
  ) {}

  public GetSchema(): EntitySchema {
    return this.resp.GetSchema();
  }

  public async Get(
    parametersOptional?: portal_resp_eset_get_args,
  ): Promise<ExtendedTypedEntityCollection<PortalRespEset, unknown>> {
    const [responsibilities, memberships] = await Promise.all([
      this.resp.Get(this.getAllResponsibilityParameters(parametersOptional)),
      this.getMemberships(parametersOptional),
    ]);

    const membershipRoleIds = memberships?.Data?.map((membership) => membership.UID_ESet.value).filter((uid): uid is string => !!uid) ?? [];
    const responsibilityIds = new Set(responsibilities.Data.map((role) => role.GetEntity().GetKeys()[0]).filter((uid): uid is string => !!uid));
    const missingRoleIds = Array.from(new Set(membershipRoleIds.filter((uid) => !responsibilityIds.has(uid))));
    const missingRoles = await this.getMissingRoles(missingRoleIds);

    return this.applyPaging(
      {
        ...responsibilities,
        totalCount: responsibilities.totalCount + missingRoles.length,
        Data: [...responsibilities.Data, ...missingRoles],
      },
      parametersOptional,
    );
  }

  private async getMemberships(
    parametersOptional?: portal_resp_eset_get_args,
  ): Promise<ExtendedTypedEntityCollection<PortalPersonRolemembershipsEset, unknown> | undefined> {
    const uidPerson = this.session.SessionState.UserUid || (await this.session.getSessionState()).UserUid;
    if (!uidPerson) {
      return undefined;
    }

    return this.memberships.Get(uidPerson, this.getAllMembershipParameters(parametersOptional));
  }

  private async getMissingRoles(missingRoleIds: string[]): Promise<PortalRespEset[]> {
    const roles = await Promise.all(
      missingRoleIds.map(async (uidEset) => {
        const result = await this.interactiveResp.Get_byid(uidEset);
        return result.Data[0];
      }),
    );

    return roles.filter((role): role is PortalRespEset => !!role);
  }

  private applyPaging(
    collection: ExtendedTypedEntityCollection<PortalRespEset, unknown>,
    parametersOptional?: CollectionLoadParameters,
  ): ExtendedTypedEntityCollection<PortalRespEset, unknown> {
    const startIndex = parametersOptional?.StartIndex ?? 0;
    const pageSize = parametersOptional?.PageSize;
    const data =
      pageSize == null || pageSize < 0 ? collection.Data : collection.Data.slice(startIndex, startIndex + pageSize);

    return {
      ...collection,
      Data: data,
    };
  }

  private getAllResponsibilityParameters(parametersOptional?: portal_resp_eset_get_args): portal_resp_eset_get_args {
    return {
      ...parametersOptional,
      StartIndex: 0,
      PageSize: -1,
    };
  }

  private getAllMembershipParameters(
    parametersOptional?: portal_resp_eset_get_args,
  ): portal_person_rolememberships_ESet_get_args {
    const { esettype: _esettype, ...membershipParameters } = parametersOptional ?? {};
    return {
      ...membershipParameters,
      StartIndex: 0,
      PageSize: -1,
    };
  }
}
