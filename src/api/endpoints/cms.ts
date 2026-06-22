import apiService from "../../services/api";

export interface CmsPageData {
  title: string;
  slug: string;
  content: string;
  status?: string;
  _id?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface GetCmsPageBySlugResponse {
  status?: string;
  message?: string;
  data?: CmsPageData;
}

/**
 * GET cms-pages/slug/{slug}
 * Fetches a CMS page by slug (e.g. "terms-and-conditions", "privacy-policy").
 */
export const getCmsPageBySlug = (
  slug: string
): Promise<GetCmsPageBySlugResponse | undefined> => {
  return apiService.get<GetCmsPageBySlugResponse>(`/cms-pages/slug/${slug}`);
};
