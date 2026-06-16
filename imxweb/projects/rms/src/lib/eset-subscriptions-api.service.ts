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

import { Injectable } from '@angular/core';
import { PortalRespEset, portal_resp_eset_get_args } from '@imx-modules/imx-api-rms';
import {
  CollectionLoadParameters,
  DataModel,
  EntityCollectionData,
  EntitySchema,
  ExtendedTypedEntityCollection,
  FilterData,
  MethodDefinition,
  MethodDescriptor,
  TimeZoneInfo,
  TypedEntity,
} from '@imx-modules/imx-qbm-dbts';
import { DynamicMethodService } from 'qbm';
import { RmsApiService } from './rms-api-client.service';

@Injectable({
  providedIn: 'root',
})
export class EsetSubscriptionsApiService {
  private readonly listPath = '/portal/admin/eset/aobentitlements';
  private readonly interactivePath = '/portal/admin/eset/aobentitlements/interactive';
  private readonly schemaPath = 'portal/resp/eset';

  constructor(
    private readonly api: RmsApiService,
    private readonly dynamicMethodService: DynamicMethodService,
  ) {}

  public GetSchema(): EntitySchema {
    return this.api.typedClient.PortalRespEset.GetSchema();
  }

  public Get(parametersOptional?: portal_resp_eset_get_args): Promise<ExtendedTypedEntityCollection<PortalRespEset, unknown>> {
    return this.dynamicMethodService.get(this.api.apiClient, this.getTypeWrapper(), parametersOptional);
  }

  public Get_byid(id: string): Promise<ExtendedTypedEntityCollection<TypedEntity, unknown>> {
    return this.dynamicMethodService.getInteractive(this.api.apiClient, this.getInteractiveTypeWrapper(), {
      name: 'UID_ESet',
      value: id,
    });
  }

  public getDataModel(filter: FilterData[]): Promise<DataModel> {
    return this.api.apiClient.processRequest(this.getDataModelDescriptor(filter));
  }

  public getExportMethod(
    withProperties: string,
    navigationState: CollectionLoadParameters,
    pageSize?: number,
  ): MethodDescriptor<EntityCollectionData> {
    const query: CollectionLoadParameters & { withProperties: string } = pageSize
      ? { ...navigationState, withProperties, PageSize: pageSize, StartIndex: 0 }
      : { ...navigationState, withProperties };
    return {
      path: this.listPath,
      parameters: MethodDefinition.MakeQueryParameters(query, []),
      method: 'GET',
      headers: {
        'imx-timezone': TimeZoneInfo.get(),
      },
      credentials: 'include',
      observe: 'response',
      responseType: 'json',
    };
  }

  private getDataModelDescriptor(filter: FilterData[]): MethodDescriptor<DataModel> {
    return {
      path: `${this.listPath}/datamodel`,
      parameters: MethodDefinition.MakeQueryParameters({ filter }, []),
      method: 'GET',
      headers: {
        'imx-timezone': TimeZoneInfo.get(),
      },
      credentials: 'include',
      observe: 'response',
      responseType: 'json',
    };
  }

  private getTypeWrapper() {
    return {
      type: PortalRespEset,
      path: this.listPath,
      schemaPath: this.schemaPath,
    };
  }

  private getInteractiveTypeWrapper() {
    return {
      type: PortalRespEset,
      path: this.interactivePath,
      schemaPath: this.schemaPath,
      key: '{UID_ESet}',
    };
  }
}
