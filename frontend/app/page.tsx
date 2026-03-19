import { NavbarClient } from "@/components/navbar-client";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <NavbarClient />
      <main className="min-h-screen flex flex-col">
        {/* Hero Section */}
        <section className="flex-1 flex items-center justify-center px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-balance">
              Invest in Real Estate on the Blockchain
            </h1>
            <p className="text-lg text-muted max-w-2xl mx-auto text-balance">
              PropVera makes real estate investing accessible through decentralized technology on Polkadot Hub. Start building your property portfolio today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/marketplace">
                <Button size="lg" className="w-full sm:w-auto">
                  Browse Properties
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  View Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-muted/20 px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-balance">Why Choose PropVera</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Decentralized",
                  description: "Built on Polkadot Hub blockchain for transparency and security",
                },
                {
                  title: "Low Minimums",
                  description: "Invest in shares of premium properties starting from any amount",
                },
                {
                  title: "Real Returns",
                  description: "Earn rental income and capital appreciation from real estate assets",
                },
              ].map((feature, idx) => (
                <div key={idx} className="space-y-3">
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-4 py-20 sm:px-6 lg:px-8 bg-primary text-white">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-bold text-balance">Ready to Start Investing?</h2>
            <p className="text-lg opacity-90">
              Connect your wallet and explore exclusive real estate opportunities.
            </p>
            <Link href="/marketplace">
              <Button size="lg" variant="secondary">
                Get Started Now
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
