export type KakaoAddressDoc = {
  address_name: string;
  x: string;
  y: string;
  address?: {
    address_name: string;
    b_code: string;
    h_code: string;
    region_1depth_name: string;
    region_2depth_name: string;
    region_3depth_name: string;
  } | null;
  road_address?: {
    address_name: string;
    road_name: string;
    region_1depth_name: string;
    region_2depth_name: string;
    region_3depth_name: string;
    building_name?: string;
  } | null;
};

export type KakaoPlaceDoc = {
  id: string;
  place_name: string;
  category_name: string;
  category_group_code: string;
  category_group_name: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
  place_url: string;
  distance: string;
};

export type NearbyCategoryResult = {
  groupCode: string;
  label: string;
  items: KakaoPlaceDoc[];
};

declare global {
  interface Window {
    kakao: any;
  }
}
