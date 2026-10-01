import { ChartColumn, ListChecks, Radio, Trophy } from 'lucide-react';

import {
  SIGNUP_ACCOUNT_BENEFIT_LEAD,
  SIGNUP_ACCOUNT_BENEFITS,
} from '../model/signupLegalCopy';

/** One icon per benefit, same order as SIGNUP_ACCOUNT_BENEFITS. */
const BENEFIT_ICONS = [Radio, Trophy, ListChecks, ChartColumn];

/**
 * Short account-only checklist above the create-account form.
 */
export default function SignupAccountBenefits() {
  return (
    <div className="mb-6 mt-3 w-full max-w-sm text-left">
      <p className="text-center text-sm font-medium text-slate-300">
        {SIGNUP_ACCOUNT_BENEFIT_LEAD}
      </p>
      <ul className="mt-2 space-y-1.5">
        {SIGNUP_ACCOUNT_BENEFITS.map((item, index) => {
          const Icon = BENEFIT_ICONS[index];
          return (
            <li
              key={item}
              className="flex items-start gap-2 text-sm leading-snug text-slate-300"
            >
              <Icon
                className="mt-0.5 shrink-0 text-teal-400"
                size={16}
                strokeWidth={2}
                aria-hidden
              />
              <span>{item}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
