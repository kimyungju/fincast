"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn, normalizeImageSrc } from "@/lib/utils";
import { sidebarLinks } from "@/constants";
import { SignedIn, useClerk, useUser, UserButton } from "@clerk/nextjs";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAudio } from "@/app/providers/AudioProvider";

const LeftSidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();
  const { user } = useUser();
  const { audio } = useAudio();

  return (
    <section className={cn("left_sidebar", { "h-[calc(100vh-140px)]": audio?.audioUrl })}>
      <nav className="flex flex-col gap-6">
        <Link
          href="/"
          className="flex cursor-pointer items-center gap-1 pb-10 max-lg:justify-center"
        >
          <Image src="/icons/logo.svg" alt="logo" width={23} height={27} />
          <h1 className="text-24 font-extrabold text-white max-lg:hidden">
            Fincast
          </h1>
        </Link>

        {sidebarLinks.map(({ route, label, imgURL }) => {
          const isActive =
            pathname === route || pathname.startsWith(`${route}/`);

          return (
            <Link
              href={route}
              key={label}
              className={cn(
                "flex gap-3 items-center py-4 max-lg:px-4 justify-center lg:justify-start",
                {
                  "bg-nav-focus border-r-4 border-orange-1": isActive,
                }
              )}
            >
              <Image
                src={normalizeImageSrc(imgURL)}
                alt={label}
                width={24}
                height={24}
              />
              <p className="max-lg:hidden">{label}</p>
            </Link>
          );
        })}
      </nav>

      <SignedIn>
        <div className="flex flex-col gap-4 w-full max-lg:px-4 lg:pr-8 pb-14">
          <Link
            href={`/profile/${user?.id}`}
            className="flex items-center gap-3 max-lg:justify-center"
          >
            <UserButton />
            <div className="flex items-center justify-between w-full max-lg:hidden">
              <h1 className="text-16 truncate font-semibold text-white-1">
                {user?.firstName} {user?.lastName}
              </h1>
              <ChevronRight size={20} className="text-white-4" />
            </div>
          </Link>
          <Button
            className="text-16 w-full bg-orange-1 font-extrabold"
            onClick={() => signOut(() => router.push("/sign-in"))}
          >
            Log Out
          </Button>
        </div>
      </SignedIn>
    </section>
  );
};

export default LeftSidebar;
