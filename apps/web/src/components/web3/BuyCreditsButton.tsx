"use client";

import { BuyCreditsModal } from "./BuyCreditsModal";

export function BuyCreditsButton(props: React.ComponentProps<typeof BuyCreditsModal>) {
  return <BuyCreditsModal {...props} />;
}
