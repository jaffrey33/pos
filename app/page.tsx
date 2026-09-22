import CafePOS from "@/components/cafe-pos";

export const getMenuItems = async () => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/menu`, {
    cache: "no-store",
  });
  return res.json();
}

export default async function Page() {
  const menu = await getMenuItems();
  return <CafePOS menu={menu} />;
}
