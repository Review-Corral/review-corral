import { Disclosure, Menu, Transition } from "@headlessui/react";
import { UserCircleIcon } from "@heroicons/react/outline";
import { useSession } from "@supabase/auth-helpers-react";
import Link from "next/link";
import { FC, Fragment } from "react";
import { useInstallations } from "../hooks/useInstallations";

export interface NavbarProps {
  activeOrganizationAccountId?: number;
}

const userNavigation = [
  { name: "Your Profile", href: "/profile" },
  { name: "Sign out", href: "/signout" },
];

export const Navbar: FC<NavbarProps> = ({ activeOrganizationAccountId }) => {
  const installations = useInstallations(
    activeOrganizationAccountId !== undefined,
  );

  const activeInstallation =
    installations.data &&
    activeOrganizationAccountId &&
    installations.data.installations.find(
      (installation) => installation.account.id === activeOrganizationAccountId,
    );

  const session = useSession();

  const avatarUrl: string | undefined =
    session?.user.user_metadata["avatar_url"];

  return (
    <Disclosure as="nav" className="bg-[#f4f4f4]">
      {({ open }) => (
        <>
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Link href="/" className="">
                  <div className="flex-shrink-0 hover:cursor-pointer">
                    <img
                      className="h-12 w-12"
                      src="https://avatars.githubusercontent.com/in/203068?s=120&u=4f27b80d54a1405e10756a1dc0175d1ef3866422&v=4"
                      alt="Workflow"
                    />
                  </div>
                </Link>

                {activeInstallation && (
                  <>
                    <div className="-mt-0.5 text-3xl text-gray-400 font-extralight">
                      /
                    </div>
                    <div className="rounded-md px-2 py- flex gap-2 items-center">
                      <div className="flex items-center space-x-2">
                        <div className="rounded-md overflow-hidden">
                          <img
                            src={activeInstallation.account.avatar_url}
                            width={32}
                            height={32}
                          />
                        </div>
                        <div>{activeInstallation.account.login}</div>
                      </div>
                      {/* <SelectorIcon className="h-5 w-5" /> */}
                    </div>
                  </>
                )}
              </div>
              <div className="block">
                <div className="ml-4 flex items-center md:ml-6">
                  <Menu as="div" className="ml-3 relative">
                    <div>
                      <Menu.Button className="max-w-xs bg-slate-200 rounded-full flex items-center text-sm text-black">
                        <span className="sr-only">Open user menu</span>
                        {avatarUrl ? (
                          <div className="rounded-full overflow-hidden">
                            <img src={avatarUrl} width={32} height={32} />
                          </div>
                        ) : (
                          <UserCircleIcon className="h-8 w-8" />
                        )}
                      </Menu.Button>
                    </div>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                        {userNavigation.map((item) => (
                          <Menu.Item key={item.name}>
                            {({ active }) => (
                              <a
                                href={item.href}
                                className={classNames(
                                  active ? "bg-gray-100" : "",
                                  "block px-4 py-2 text-sm text-gray-700",
                                )}
                              >
                                {item.name}
                              </a>
                            )}
                          </Menu.Item>
                        ))}
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </Disclosure>
  );
};

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}
