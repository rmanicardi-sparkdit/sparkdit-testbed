import { CachingInboundPolicy, CachingInboundPolicyOptions, HttpProblems, ZuploContext, ZuploRequest } from "@zuplo/runtime";
import { cacheKeyLoader } from "./cache-keys";


export default async function policy(
  request: ZuploRequest,
  context: ZuploContext,
  noOptions: never,
  policyName: string
) {

  const customerId = request.user.data.customerId;
  const applicationId = request.query.app_id;

  if (!customerId) {
    throw new Error(`No customerId found in user metadata`);
  }

  if (!applicationId) {
    return HttpProblems.badRequest(request, context, { detail: "No application-id header provided" });
  }


  const cacheKeys = await cacheKeyLoader.get("all");
  context.log.debug("customerId:" + customerId + "- applicationId:" + applicationId);

  //  const cacheKey = cacheKeys.find(ck => ck.applicationId === applicationId && ck.customerId === customerId);
  const cacheKey = {
    applicationId: 313,
    customerId: "shopify",
    cacheKey: "shopify-313-2",
    ttlSeconds: 3600
  }


  if (!cacheKey) {
    throw new Error(`No cacheKey found for customer '${customerId}' and application '${applicationId}'`);
  }

  const options: CachingInboundPolicyOptions = {
    "cacheHttpMethods": [
      "GET"
    ],
    cacheId: cacheKey.cacheKey,
    dangerouslyIgnoreAuthorizationHeader: true,
    expirationSecondsTtl: cacheKey.ttlSeconds ?? 60 // default to 60s
  }

  const result = await CachingInboundPolicy(request, context, options, policyName);
  let hit = (result instanceof Response) ? true : false;

  context.log.info({ cacheHit: hit, cacheKey });

  return result;
}