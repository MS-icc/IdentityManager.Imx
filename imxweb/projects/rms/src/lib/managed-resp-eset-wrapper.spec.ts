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

import { PortalRespEset } from '@imx-modules/imx-api-rms';
import { IEntity } from '@imx-modules/imx-qbm-dbts';
import { ManagedRespEsetWrapper } from './managed-resp-eset-wrapper';

describe('ManagedRespEsetWrapper', () => {
  const createRole = (uid: string): Pick<PortalRespEset, 'GetEntity'> => ({
      GetEntity: () => ({
        GetKeys: () => [uid],
      } as IEntity),
    });

  it('should append membership-only roles and keep combined total count', async () => {
    const resp = jasmine.createSpyObj('resp', ['Get', 'GetSchema']);
    const interactiveResp = jasmine.createSpyObj('interactiveResp', ['Get_byid']);
    const memberships = jasmine.createSpyObj('memberships', ['Get']);
    const session = {
      SessionState: { UserUid: 'person-1' },
      getSessionState: jasmine.createSpy('getSessionState'),
    } as any;

    resp.Get.and.resolveTo({
      Data: [createRole('role-1')],
      totalCount: 1,
      tableName: 'ESet',
    });
    memberships.Get.and.resolveTo({
      Data: [{ UID_ESet: { value: 'role-1' } }, { UID_ESet: { value: 'role-2' } }],
      totalCount: 2,
    });
    interactiveResp.Get_byid.and.resolveTo({
      Data: [createRole('role-2')],
      totalCount: 1,
    });

    const wrapper = new ManagedRespEsetWrapper(resp, interactiveResp, memberships, session);

    const result = await wrapper.Get({ StartIndex: 0, PageSize: 10, search: 'admin', esettype: 'TYPE_A' });

    expect(resp.Get).toHaveBeenCalledWith({ StartIndex: 0, PageSize: -1, search: 'admin', esettype: 'TYPE_A' });
    expect(memberships.Get).toHaveBeenCalledWith('person-1', { StartIndex: 0, PageSize: -1, search: 'admin' });
    expect(interactiveResp.Get_byid).toHaveBeenCalledOnceWith('role-2');
    expect(result.totalCount).toBe(2);
    expect(result.Data.map((role) => role.GetEntity().GetKeys()[0])).toEqual(['role-1', 'role-2']);
  });

  it('should apply paging after merging roles', async () => {
    const resp = jasmine.createSpyObj('resp', ['Get', 'GetSchema']);
    const interactiveResp = jasmine.createSpyObj('interactiveResp', ['Get_byid']);
    const memberships = jasmine.createSpyObj('memberships', ['Get']);
    const session = {
      SessionState: { UserUid: 'person-1' },
      getSessionState: jasmine.createSpy('getSessionState'),
    } as any;

    resp.Get.and.resolveTo({
      Data: [createRole('role-1')],
      totalCount: 1,
      tableName: 'ESet',
    });
    memberships.Get.and.resolveTo({
      Data: [{ UID_ESet: { value: 'role-2' } }],
      totalCount: 1,
    });
    interactiveResp.Get_byid.and.resolveTo({
      Data: [createRole('role-2')],
      totalCount: 1,
    });

    const wrapper = new ManagedRespEsetWrapper(resp, interactiveResp, memberships, session);

    const result = await wrapper.Get({ StartIndex: 1, PageSize: 1 });

    expect(result.totalCount).toBe(2);
    expect(result.Data.map((role) => role.GetEntity().GetKeys()[0])).toEqual(['role-2']);
  });

  it('should resolve the current user via getSessionState when SessionState is empty', async () => {
    const resp = jasmine.createSpyObj('resp', ['Get', 'GetSchema']);
    const interactiveResp = jasmine.createSpyObj('interactiveResp', ['Get_byid']);
    const memberships = jasmine.createSpyObj('memberships', ['Get']);
    const session = {
      SessionState: { UserUid: '' },
      getSessionState: jasmine.createSpy('getSessionState').and.resolveTo({ UserUid: 'person-2' }),
    } as any;

    resp.Get.and.resolveTo({
      Data: [],
      totalCount: 0,
      tableName: 'ESet',
    });
    memberships.Get.and.resolveTo({
      Data: [],
      totalCount: 0,
    });

    const wrapper = new ManagedRespEsetWrapper(resp, interactiveResp, memberships, session);

    await wrapper.Get();

    expect(session.getSessionState).toHaveBeenCalled();
    expect(memberships.Get).toHaveBeenCalledWith('person-2', { StartIndex: 0, PageSize: -1 });
    expect(interactiveResp.Get_byid).not.toHaveBeenCalled();
  });
});
