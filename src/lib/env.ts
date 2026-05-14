function required(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === "") {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}

export const env = {
  get dataGoKrServiceKey() {
    return required("DATA_GO_KR_SERVICE_KEY");
  },
  get kakaoRestKey() {
    return required("KAKAO_REST_API_KEY");
  },
  get geminiApiKey() {
    return required("GEMINI_API_KEY");
  },
  get odsayApiKey() {
    return required("ODSAY_API_KEY");
  },
};
