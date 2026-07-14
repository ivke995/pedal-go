import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const FAQS = [
  {
    q: 'Do I need an account to book?',
    a: 'No account needed. Just choose your dates, enter your details, and pay online. Your reservation is confirmed instantly.',
  },
  {
    q: 'When is my reservation confirmed?',
    a: 'Your reservation is confirmed as soon as your online payment is completed. You will receive a confirmation email with your reservation number.',
  },
  {
    q: 'Can I cancel my booking?',
    a: 'Yes. You can cancel free of charge up to 24 hours before your pickup time. Cancellations are handled through the confirmation email or by contacting our team.',
  },
  {
    q: 'What do I need when picking up the bicycle?',
    a: 'Please bring your reservation number and a valid photo ID. That is all you need to collect your bike at our pickup location.',
  },
  {
    q: 'Is a lock included?',
    a: 'Yes, every rental includes a sturdy lock at no extra cost, so you can park with peace of mind while you explore.',
  },
  {
    q: 'What happens if I return the bicycle late?',
    a: 'Every started 24-hour period counts as one rental day. If you return later than planned, an additional day may be charged at the standard daily rate.',
  },
]

export function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-20 py-16 sm:py-24">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            FAQ
          </p>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground text-balance sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="max-w-xl text-muted-foreground text-pretty">
            Everything you need to know about renting a bike with PedalGo.
          </p>
        </div>

        <Accordion className="mt-10">
          {FAQS.map((faq, i) => (
            <AccordionItem key={faq.q} value={`item-${i}`}>
              <AccordionTrigger className="text-left font-heading text-base font-semibold">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-pretty">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
