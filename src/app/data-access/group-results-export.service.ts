import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, switchMap, take } from 'rxjs';
import { z } from 'zod';
import { APPCONFIG } from '../config';
import { IdentityTokenService } from '../services/auth/identity-token.service';
import { decodeSnakeCase } from '../utils/operators/decode';
import { isHttpsAbsoluteUrl } from '../utils/open-https-download-url';
import { ActionResponse, successData } from './action-response';

const groupResultsTokenDataSchema = z.object({
  groupResultsToken: z.string(),
  expiresIn: z.number(),
});

export type GroupResultsTokenData = z.infer<typeof groupResultsTokenDataSchema>;

const requestExportResponseSchema = z.object({
  exportId: z.string(),
  expiresAt: z.number(), // Unix milliseconds (API contract)
});

export type GroupResultsExportRequest = z.infer<typeof requestExportResponseSchema>;

const downloadUrlResponseSchema = z.object({
  url: z.string().refine(isHttpsAbsoluteUrl, { message: 'Download URL must be an absolute https URL' }),
});

@Injectable({
  providedIn: 'root',
})
export class GroupResultsExportService {
  private http = inject(HttpClient);
  private config = inject(APPCONFIG);
  private identityTokenService = inject(IdentityTokenService);

  getGroupResultsToken(groupId: string, parentItemIds: string[]): Observable<GroupResultsTokenData> {
    const params = new HttpParams().set('parent_item_ids', parentItemIds.join(','));
    return this.http
      .post<ActionResponse<unknown>>(
        `${this.config.apiUrl}/groups/${groupId}/group-results-token`,
        undefined,
        { params },
      )
      .pipe(
        map(successData),
        decodeSnakeCase(groupResultsTokenDataSchema),
      );
  }

  requestExport(
    groupResultsToken: string,
    groupId: string,
    parentItemIds: string[],
  ): Observable<GroupResultsExportRequest> {
    const slsApiUrl = this.requireSlsApiUrl();
    return this.http
      .post<unknown>(
        `${slsApiUrl}/group-results-exports`,
        { group_id: groupId, parent_item_ids: parentItemIds },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        { headers: { Authorization: `Bearer ${groupResultsToken}` } },
      )
      .pipe(decodeSnakeCase(requestExportResponseSchema));
  }

  getDownloadUrl(exportId: string): Observable<string> {
    const slsApiUrl = this.requireSlsApiUrl();
    return this.identityTokenService.identityToken$.pipe(
      take(1),
      switchMap(token => this.http.get<unknown>(
        `${slsApiUrl}/group-results-exports/${encodeURIComponent(exportId)}/download-url`,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        { headers: { Authorization: `Bearer ${token}` } },
      )),
      decodeSnakeCase(downloadUrlResponseSchema),
      map(response => response.url),
    );
  }

  private requireSlsApiUrl(): string {
    if (!this.config.slsApiUrl) {
      throw new Error('slsApiUrl is not configured');
    }
    return this.config.slsApiUrl;
  }
}
