import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const FAQS = [
  {
    q: 'Do I need an account to book?',
    a: 'No account needed. Choose your dates, enter your details, and select Venmo or Zelle. We will send payment instructions with your reservation details.',
  },
  {
    q: 'When is my reservation confirmed?',
    a: 'Your reservation stays pending manual confirmation after you submit. We confirm it after independently verifying the external payment. You will receive the next steps by email.',
  },
  {
    q: 'Can I cancel my booking?',
    a: 'Please call (603) 348-1320 as soon as possible and we will help with your request.',
  },
  {
    q: 'What do I need when picking up the bicycle?',
    a: 'Keep your reservation reference handy. If we are delivering to your hotel, we will coordinate the handoff with you directly.',
  },
  {
    q: 'Is a lock included?',
    a: 'Yes, every rental includes a lock at no extra cost, so you can stop and explore with peace of mind.',
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
            Everything you need to know before your White Mountains ride.
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
