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
 * Copyright 2024 One Identity LLC.
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
import { V2Client, TypedClient } from '@imx-modules/imx-api-aob';
import { ApiClient } from '@imx-modules/imx-qbm-dbts';
import { AppConfigService, ClassloggerService, ImxTranslationProviderService } from 'qbm';

@Injectable({
  providedIn: 'root',
})
export class AobApiService {
  private readonly recertIntervalConfigPaths = [
    'NConfig/CCC/RecertIntervalDefault',
    'NConfig/CCC/RecertInterval',
    'ServerLevelConfig/CCC/RecertIntervalDefault',
  ];

  private tc: TypedClient;
  public get typedClient(): TypedClient {
    return this.tc;
  }

  private c: V2Client;
  public get client(): V2Client {
    return this.c;
  }

  public get apiClient(): ApiClient {
    return this.config.apiClient;
  }

  constructor(
    private readonly config: AppConfigService,
    private readonly logger: ClassloggerService,
    private readonly translationProvider: ImxTranslationProviderService,
  ) {
    try {
      this.logger.debug(this, 'Initializing AOB API service');

      // Use schema loaded by QBM client
      const schemaProvider = config.client;
      this.c = new V2Client(config.apiClient, schemaProvider);
      this.tc = new TypedClient(this.c, this.translationProvider);
    } catch (e) {
      this.logger.error(this, e);
    }
  }

  public async getRecertIntervalDefault(): Promise<number | undefined> {
    const customEndpointValue = await this.getCustomRecertIntervalValue();
    if (customEndpointValue != null) {
      return customEndpointValue;
    }

    for (const path of this.recertIntervalConfigPaths) {
      try {
        const value = await this.config.client.admin_apiconfigsingle_get('imx', path);
        const parsedValue = this.parseRecertInterval(value);
        if (parsedValue != null) {
          return parsedValue;
        }
      } catch {
        // Try next possible path.
      }
    }

    return undefined;
  }

  private async getCustomRecertIntervalValue(): Promise<number | undefined> {
    const clientWithCustomEndpoint = this.client as unknown as {
      portal_ccc_recertinterval_default_get?: () => Promise<unknown>;
    };

    if (typeof clientWithCustomEndpoint.portal_ccc_recertinterval_default_get !== 'function') {
      return undefined;
    }

    try {
      return this.parseRecertInterval(await clientWithCustomEndpoint.portal_ccc_recertinterval_default_get());
    } catch {
      return undefined;
    }
  }

  private parseRecertInterval(value: unknown): number | undefined {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : undefined;
    }

    if (typeof value === 'string') {
      const trimmedValue = value.trim();
      if (trimmedValue.length === 0) {
        return undefined;
      }

      const parsedValue = Number(trimmedValue);
      return Number.isFinite(parsedValue) ? parsedValue : undefined;
    }

    if (value != null && typeof value === 'object') {
      const typedValue = value as { Value?: unknown; value?: unknown; DataValue?: unknown };
      const nestedValue = typedValue.Value ?? typedValue.value ?? typedValue.DataValue;
      return this.parseRecertInterval(nestedValue);
    }

    return undefined;
  }
}
