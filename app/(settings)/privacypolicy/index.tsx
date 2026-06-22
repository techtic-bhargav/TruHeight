import { Redirect } from "expo-router";

export default function PrivacyPolicyRedirect() {
  return <Redirect href={{ pathname: "/cmswebview", params: { type: "privacy" } }} />;
}
