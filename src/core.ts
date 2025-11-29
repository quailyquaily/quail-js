import { sendRequest, sendRequestFormData } from "./lib/request";
import { getAccessTokenFromEnv } from "./lib/auth";

export class Client {
  apibase = "";
  apikey = "";
  access_token = "";
  debug = false;

  constructor(opts: any) {
    this.apikey = opts.apikey || "";
    this.access_token = opts.access_token || "";
    this.apibase = opts.apibase || "https://api.quaily.com";
    this.debug = opts.debug || false;
  }

  getAccessToken() {
    let token = this.access_token;
    if (token === "") {
      token = getAccessTokenFromEnv();
    }
    return token;
  }

  async request(url: string, method: string, body: any): Promise<any> {
    url = this.apibase + url;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // try to use token from environment
    const token = this.getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (this.apikey) {
      headers["X-QUAIL-KEY"] = this.apikey;
    }

    if (this.debug) {
      console.log(`request: ${method} ${url}`);
      console.log("- headers", headers);
      console.log("- body", body);
    }

    return sendRequest(url, method, headers, body);
  }

  async requestFormData(url: string, body: any): Promise<any> {
    url = this.apibase + url;
    const headers: Record<string, string> = {};

    // try to use token from environment
    const token = this.getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (this.apikey) {
      headers["X-QUAIL-KEY"] = this.apikey;
    }

    if (this.debug) {
      console.log(`request: POST ${url}`);
      console.log("- headers", headers);
      console.log("- body", body);
    }

    return sendRequestFormData(url, headers, body);
  }

  getAuthCode(email: string, ctoken: string, scene = "login"): Promise<any> {
    let lang = navigator.language;
    if (lang.length > 2) {
      lang = lang.substring(0, 2);
    }

    return this.request(`/auth/code`, "POST", {
      email,
      lang,
      scene,
      "challenge-action": "request_auth_code",
      "challenge-token": ctoken,
    });
  }

  login(email: string, code: string): Promise<any> {
    let lang = navigator.language;
    if (lang.length > 2) {
      lang = lang.substring(0, 2);
    }

    return this.request(`/auth/login`, "POST", {
      method: "email_code",
      email: email,
      code: code,
      lang: lang,
    });
  }

  issueEphemeralToken(origin: string): Promise<any> {
    return this.request(`/auth/ephemeral?origin=${origin}`, "POST", null);
  }

  exchangeAccessTokenWithEphemeral(token: string): Promise<any> {
    return this.request(
      `/auth/ephemeral/exchange?token=${token}`,
      "POST",
      null,
    );
  }

  getConfig(): Promise<any> {
    return this.request(`/c`, "GET", null);
  }

  getMe(): Promise<any> {
    return this.request(`/users/me`, "GET", null);
  }

  updateMe(profile: any): Promise<any> {
    return this.request(`/users/me`, "PUT", profile);
  }

  updateMeEmail(email, code): Promise<any> {
    return this.request(`/users/me/email`, "PUT", {
      email,
      code,
    });
  }

  updateMeOptions(options: any): Promise<any> {
    return this.request(`/users/me/options`, "PUT", {
      options,
    });
  }

  getUser(user_id: number): Promise<any> {
    return this.request(`/users/${user_id}`, "GET", null);
  }

  getUserLists(user_id: number): Promise<any> {
    return this.request(`/users/${user_id}/lists`, "GET", null);
  }

  // @TODO: 准备弃用
  subscribe(
    list_id: number | string,
    email: string,
    ctoken: string,
  ): Promise<any> {
    return this.request(`/subscriptions/${list_id}`, "POST", {
      email,
      "challenge-action": "subscribe",
      "challenge-token": ctoken,
    });
  }

  subscribeWithChallenge(
    list_id: number | string,
    email: string,
    params: any,
  ): Promise<any> {
    let payload = { email, "challenge-provider": params["challenge-provider"] };
    if (params["challenge-provider"] === "turnstile") {
      payload["challenge-action"] = params["challenge-action"];
      payload["challenge-token"] = params["challenge-token"];
    } else if (params["challenge-provider"] === "tencentcloud") {
      payload["challenge-action"] = params["challenge-action"];
      payload["challenge-nonce"] = params["challenge-nonce"];
      payload["challenge-ticket"] = params["challenge-ticket"];
    }
    return this.request(`/subscriptions/${list_id}`, "POST", payload);
  }

  updateSubscriber(
    list_id: number | string,
    member_id: number,
    payload: any,
  ): Promise<any> {
    return this.request(
      `/subscriptions/${list_id}/members/${member_id}`,
      "PUT",
      payload,
    );
  }

  deleteSubscriber(list_id: number | string, member_id: number): Promise<any> {
    return this.request(
      `/subscriptions/${list_id}/members/${member_id}`,
      "DELETE",
      null,
    );
  }

  getMySubscriptions(): Promise<any> {
    return this.request(`/subscriptions`, "GET", null);
  }

  getMySubscription(list_id: number | string): Promise<any> {
    return this.request(`/subscriptions/${list_id}/rel`, "GET", null);
  }

  subscribeNoChallenge(list_id: number | string): Promise<any> {
    return this.request(`/subscriptions/${list_id}/no-challenge`, "POST", null);
  }

  unsubscribe(list_id: number | string, trace_id = ""): Promise<any> {
    return this.request(`/subscriptions/${list_id}`, "DELETE", { trace_id });
  }

  getUnsubscribeOpponent(trace_id: string): Promise<any> {
    return this.request(
      `/subscriptions/opponent?trace_id=${trace_id}`,
      "GET",
      null,
    );
  }

  getListPosts(
    list_id: number | string,
    offset = 0,
    limit = 16,
    pub = false,
    sort = "",
  ): Promise<any> {
    let url = `/lists/${list_id}/posts?offset=${offset}&limit=${limit}`;
    if (pub) {
      url += `&public=1`;
    }
    if (sort) {
      url += `&sort=${sort}`;
    }
    return this.request(url, "GET", null);
  }

  getListDeliveryTasks(
    list_id: number | string,
    offset = 0,
    limit = 10,
  ): Promise<any> {
    return this.request(
      `/lists/${list_id}/delivery?offset=${offset}&limit=${limit}`,
      "GET",
      null,
    );
  }

  getListDeliveryTask(list_id: number | string, task_id: number): Promise<any> {
    return this.request(`/lists/${list_id}/delivery/${task_id}`, "GET", null);
  }

  cancelScheduledDeliveryTask(
    list_id: number | string,
    task_id: number,
  ): Promise<any> {
    return this.request(
      `/lists/${list_id}/delivery/${task_id}/cancel`,
      "PUT",
      null,
    );
  }

  getPinnedPosts(list_id: number | string): Promise<any> {
    return this.request(`/lists/${list_id}/pinned`, "GET", null);
  }

  pinPosts(list_id: number, ids: number[]): Promise<any> {
    return this.request(`/lists/${list_id}/pinned`, "PUT", { ids });
  }

  getPost(list_id: number | string, post_id: number | string): Promise<any> {
    return this.request(`/lists/${list_id}/posts/${post_id}`, "GET", null);
  }

  deletePost(list_id: number | string, post_id: number | string): Promise<any> {
    return this.request(`/lists/${list_id}/posts/${post_id}`, "DELETE", null);
  }

  getPostContent(
    list_id: number | string,
    post_id: number | string,
  ): Promise<any> {
    return this.request(
      `/lists/${list_id}/posts/${post_id}/content`,
      "GET",
      null,
    );
  }

  searchPosts(q: string, list = 0, offset = 0): Promise<any> {
    return this.request(`/posts/search`, "POST", {
      q,
      list,
      offset,
    });
  }

  createList(payload: any): Promise<any> {
    return this.request(`/lists`, "POST", payload);
  }

  getLists(user_id: number | string): Promise<any> {
    return this.request(`/users/${user_id}/lists`, "GET", null);
  }

  getList(list_id: number | string): Promise<any> {
    return this.request(`/lists/${list_id}`, "GET", null);
  }

  getListByDomain(domain: number | string): Promise<any> {
    return this.request(`/lists/domains/${domain}`, "GET", null);
  }

  getListMetrics(list_id: number | string): Promise<any> {
    return this.request(`/lists/${list_id}/metrics`, "GET", null);
  }

  updateList(list_id: number | string, payload: any): Promise<any> {
    return this.request(`/lists/${list_id}`, "PUT", payload);
  }

  updateListBulletin(list_id: number | string, payload: any): Promise<any> {
    return this.request(`/lists/${list_id}/bulletin`, "PUT", payload);
  }

  updateListChannel(list_id: number | string, payload: any): Promise<any> {
    return this.request(`/lists/${list_id}/channel`, "PUT", payload);
  }

  getListChannel(list_id: number | string): Promise<any> {
    return this.request(`/lists/${list_id}/channel`, "GET", null);
  }

  createListChannelLineKeys(list_id: number | string): Promise<any> {
    return this.request(`/lists/${list_id}/channel/line/keys`, "POST", null);
  }

  getTwitterAuthUrl(list_id: number): Promise<any> {
    return this.request(
      `/twitter/authorize?list=${list_id || ""}`,
      "GET",
      null,
    );
  }

  updateListAnalytics(list_id: number | string, payload: any): Promise<any> {
    return this.request(`/lists/${list_id}/analytics`, "PUT", payload);
  }

  updateListEmailSettings(
    list_id: number | string,
    payload: any,
  ): Promise<any> {
    return this.request(`/lists/${list_id}/email_settings`, "PUT", {
      email_channel_enabled: payload.email_channel_enabled,
      email_deny_list: payload.email_deny_list || [],
    });
  }

  updateListSlug(list_id: number | string, slug: string): Promise<any> {
    return this.request(`/lists/${list_id}/slug?slug=${slug}`, "PUT", null);
  }

  updateListDomain(list_id: number | string, payload: any): Promise<any> {
    return this.request(`/lists/${list_id}/domain`, "PUT", payload);
  }

  updateListComment(list_id: number | string, payload: any): Promise<any> {
    return this.request(`/lists/${list_id}/comment`, "PUT", payload);
  }

  updateListTweets(list_id: number | string, payload: any): Promise<any> {
    return this.request(`/lists/${list_id}/tweets`, "PUT", payload);
  }

  updateListCooperators(list_id: number | string, payload: any): Promise<any> {
    return this.request(`/lists/${list_id}/cooperators`, "PUT", payload);
  }

  updateListOptions(list_id: number | string, options: any): Promise<any> {
    return this.request(`/lists/${list_id}/options`, "PUT", {
      options,
    });
  }

  createListExport(list_id: number | string): Promise<any> {
    return this.request(`/lists/${list_id}/export.zip`, "POST", null);
  }

  getListSubscriptions(
    list_id: number | string,
    offset: number,
    limit: number,
    email = "",
    premium = "",
  ): Promise<any> {
    let url = `/lists/${list_id}/subscriptions?offset=${offset}&limit=${limit}`;
    if (email) {
      url += `&email=${encodeURIComponent(email)}`;
    }
    if (premium) {
      url += `&premium=${premium}`;
    }
    return this.request(url, "GET", null);
  }

  getApikeys(): Promise<any> {
    return this.request(`/apikeys`, "GET", null);
  }

  deleteApikey(id: number): Promise<any> {
    return this.request(`/apikeys/${id}`, "DELETE", null);
  }

  createApikey(name: string): Promise<any> {
    return this.request(`/apikeys`, "POST", {
      name,
    });
  }

  searchPhotos(query: string, page = 1, limit = 10): Promise<any> {
    query = encodeURIComponent(query);
    return this.request(
      `/composer/unsplash/photos/search?query=${query}&page=${page}&limit=${limit}`,
      "GET",
      null,
    );
  }

  getPhotoDownloadUrl(endpoint: string): Promise<any> {
    endpoint = encodeURIComponent(endpoint);
    return this.request(
      `/composer/unsplash/photos/download_url?endpoint=${endpoint}`,
      "GET",
      null,
    );
  }

  createPost(listID: any, payload: any): Promise<any> {
    return this.request(`/lists/${listID}/posts`, "POST", payload);
  }

  updatePost(listID: any, postID: any, payload: any): Promise<any> {
    return this.request(
      `/lists/${listID}/posts/${postID}/update`,
      "PUT",
      payload,
    );
  }

  updatePostOptions(listID: any, postID: any, options: any): Promise<any> {
    return this.request(`/lists/${listID}/posts/${postID}/options`, "PUT", {
      options,
    });
  }

  publishPost(listID: any, slug: any): Promise<any> {
    return this.request(`/lists/${listID}/posts/${slug}/publish`, "PUT", null);
  }

  unpublishPost(listID: any, slug: any): Promise<any> {
    return this.request(
      `/lists/${listID}/posts/${slug}/unpublish`,
      "PUT",
      null,
    );
  }

  deliverPost(
    listID: any,
    slug: any,
    scheduledAt,
    channels = [],
  ): Promise<any> {
    let payload: any = {
      channels: [],
    };
    if (scheduledAt) {
      payload.scheduled_at = scheduledAt;
    }
    if (channels) {
      payload.channels = channels;
    }
    return this.request(
      `/lists/${listID}/posts/${slug}/deliver`,
      "PUT",
      payload,
    );
  }

  createPostPreviewToken(listID: any, slug: any): Promise<any> {
    return this.request(`/lists/${listID}/posts/${slug}/preview`, "POST", null);
  }

  getPostPreviewUrl(listID: any, slug: any, token: string): string {
    return `${this.apibase}/lists/${listID}/posts/${slug}/preview?access_token=${token}`;
  }

  uploadAttachment(formData: FormData, encrypted: boolean): Promise<any> {
    let appended = "";
    if (encrypted) {
      appended = `?encrypted=${encrypted}`;
    }
    return this.requestFormData(`/attachments${appended}`, formData);
  }

  incCount(post_id, field, utmParams = null): Promise<any> {
    let url = `/posts/${field}?id=${post_id}`;

    if (utmParams && typeof utmParams === "object") {
      const utmQueryParams = Object.entries(utmParams)
        .filter(
          ([key, value]) =>
            value !== null && value !== undefined && value !== "",
        )
        .map(
          ([key, value]) =>
            `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
        )
        .join("&");

      if (utmQueryParams) {
        url += `&${utmQueryParams}`;
      }
    }

    return this.request(url, "POST", null);
  }

  getPostsOfMySubscriptions(offset = 0, limit = 16): Promise<any> {
    return this.request(
      `/posts/subscribed?offset=${offset}&limit=${limit}`,
      "GET",
      null,
    );
  }

  getExploreTrendingPosts(offset = 0, limit = 16, lang = ""): Promise<any> {
    let url = `/explore/trending/posts?offset=${offset}&limit=${limit}`;
    if (lang) {
      url += `&lang=${lang}`;
    }
    return this.request(url, "GET", null);
  }

  getExploreTrendingLists(offset = 0, limit = 16, lang = ""): Promise<any> {
    let url = `/explore/trending/lists?offset=${offset}&limit=${limit}`;
    if (lang) {
      url += `&lang=${lang}`;
    }
    return this.request(url, "GET", null);
  }

  getComments(post_id: number, offset = 0, limit = 16): Promise<any> {
    return this.request(
      `/comments?post_id=${post_id}&offset=${offset}&limit=${limit}`,
      "GET",
      null,
    );
  }

  getCommentsByList(list_id: number, offset = 0, limit = 16): Promise<any> {
    return this.request(
      `/comments?list_id=${list_id}&offset=${offset}&limit=${limit}`,
      "GET",
      null,
    );
  }

  createComment(payload: any): Promise<any> {
    return this.request(`/comments`, "POST", payload);
  }

  deleteComment(comment_id: number): Promise<any> {
    return this.request(`/comments/${comment_id}`, "DELETE", null);
  }

  approveComment(comment_id: number): Promise<any> {
    return this.request(`/comments/${comment_id}/approve`, "PUT", null);
  }

  rejectComment(comment_id: number): Promise<any> {
    return this.request(`/comments/${comment_id}/reject`, "PUT", null);
  }

  // tweets
  getTweets(
    list_id: number | string,
    offset = 0,
    limit = 16,
    pub = false,
  ): Promise<any> {
    let url = `/tweets?list=${list_id}&offset=${offset}&limit=${limit}`;
    if (pub) {
      url += `&public=1`;
    }
    return this.request(url, "GET", null);
  }

  getTweet(tweet_id: number | string): Promise<any> {
    let url = `/tweets/${tweet_id}`;
    return this.request(url, "GET", null);
  }

  getPinnedTweets(list_id: number | string): Promise<any> {
    return this.request(`/tweets/pinned?list=${list_id}`, "GET", null);
  }

  createTweet(list_id: number | string, payload: any): Promise<any> {
    return this.request(`/tweets?list=${list_id}`, "POST", payload);
  }

  updateTweet(tweet_id: number | string, payload: any): Promise<any> {
    return this.request(`/tweets/${tweet_id}`, "PUT", payload);
  }

  deleteTweet(tweet_id: number | string): Promise<any> {
    return this.request(`/tweets/${tweet_id}`, "DELETE", null);
  }

  reactTweet(tweet_id: number | string, payload: any): Promise<any> {
    return this.request(`/tweets/${tweet_id}/reactions`, "POST", payload);
  }

  pinTweet(tweet_id: number | string): Promise<any> {
    return this.request(`/tweets/${tweet_id}/pin`, "PUT", null);
  }

  unpinTweet(tweet_id: number | string): Promise<any> {
    return this.request(`/tweets/${tweet_id}/unpin`, "DELETE", null);
  }

  setTweetPremium(tweet_id: number | string, premium: boolean): Promise<any> {
    return this.request(`/tweets/${tweet_id}/premium`, "PUT", { premium });
  }

  setTweetNonPremium(tweet_id: number | string): Promise<any> {
    return this.request(`/tweets/${tweet_id}/premium`, "DELETE", null);
  }

  getTweetReplies(
    tweet_id: number | string,
    offset = 0,
    limit = 16,
  ): Promise<any> {
    return this.request(
      `/tweets/${tweet_id}/replies?offset=${offset}&limit=${limit}`,
      "GET",
      null,
    );
  }

  createTweetReply(payload: any): Promise<any> {
    return this.request(`/tweets/${payload.tweet_id}/replies`, "POST", payload);
  }

  deleteTweetReply(
    tweet_id: number | string,
    reply_id: number | string,
  ): Promise<any> {
    return this.request(
      `/tweets/${tweet_id}/replies/${reply_id}`,
      "DELETE",
      null,
    );
  }

  // pack
  getListPacks(list_id: number | string): Promise<any> {
    return this.request(`/lists/${list_id}/packs`, "GET", null);
  }

  getListPack(
    list_id: number | string,
    pack_id: number | string,
  ): Promise<any> {
    return this.request(`/lists/${list_id}/packs/${pack_id}`, "GET", null);
  }

  createListPack(list_id: number | string, payload: any): Promise<any> {
    return this.request(`/lists/${list_id}/packs`, "POST", payload);
  }

  updateListPack(
    list_id: number | string,
    pack_id: number | string,
    payload: any,
  ): Promise<any> {
    return this.request(`/lists/${list_id}/packs/${pack_id}`, "PUT", payload);
  }

  deleteListPack(list_id: number | string, pack_id: number): Promise<any> {
    return this.request(`/lists/${list_id}/packs/${pack_id}`, "DELETE", null);
  }
}
