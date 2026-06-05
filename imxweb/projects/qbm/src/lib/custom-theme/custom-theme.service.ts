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

import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { EuiThemeService } from '@elemental-ui/core';
import { AppConfigService } from '../appConfig/appConfig.service';

@Injectable({ providedIn: 'root' })
export class CustomThemeService {
  private loadThemesPromise: Promise<void> | undefined;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private readonly config: AppConfigService,
    private readonly themeService: EuiThemeService,
  ) {}

  public initialize(): void {
    this.config.initializedSubject.subscribe(() => {
      void this.loadThemes();
    });

    if (this.config.client) {
      void this.loadThemes();
    }

    this.themeService.getThemeSwitcherState().subscribe(() => {
      this.applyCustomThemeClass();
    });
  }

  public async loadThemes(): Promise<void> {
    if (!this.loadThemesPromise) {
      this.loadThemesPromise = this.loadThemesInternal();
    }

    await this.loadThemesPromise;
  }

  private async loadThemesInternal(): Promise<void> {
    // load custom theme information from server
    const customThemes = await this.config.client.imx_themes_get();

    // for each custom theme, load the CSS and add it to the head
    const head = this.document.getElementsByTagName('head')[0];

    for (var theme of customThemes) {
      if (!theme.Urls) {
        continue;
      }
      for (var url of theme.Urls) {
        if (head.querySelector(`link[rel="stylesheet"][href="${url}"]`)) {
          continue;
        }

        const style = this.document.createElement('link');
        style.rel = 'stylesheet';
        style.href = url;
        head.appendChild(style);
      }
    }

    this._customThemes = customThemes.map((m) => {
      // map .NET types to the expected type for the theme switcher
      return {
        name: m.DisplayName ?? '',
        class: m.Class ?? '',
      };
    });

    this.applyCustomThemeClass();
  }

  private _customThemes: { name: string; class: string }[] = [];

  public get customThemes() {
    return this._customThemes;
  }

  private applyCustomThemeClass(): void {
    const activeTheme = localStorage.getItem('eui-theme') ?? this.config.Config?.DefaultHtmlTheme ?? '';
    const customThemeClasses = this._customThemes.map((theme) => theme.class).filter((themeClass) => !!themeClass);

    this.document.body.classList.remove(...customThemeClasses);

    if (customThemeClasses.includes(activeTheme)) {
      this.document.body.classList.add(activeTheme);
    }
  }
}
