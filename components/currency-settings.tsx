"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateUsdConversionRate, updateCurrency } from "@/app/actions/settings";
import { type Currency } from "@/lib/utils";
import { useCurrency } from "@/components/currency-provider";

const currencySchema = z.object({
  currency: z.enum(["INR", "USD"]),
  usdConversionRate: z.number().positive("Conversion rate must be positive"),
});

type CurrencyFormValues = z.infer<typeof currencySchema>;

interface CurrencySettingsProps {
  initialConversionRate: number;
  initialCurrency: Currency;
}

export function CurrencySettings({ initialConversionRate, initialCurrency }: CurrencySettingsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setCurrency } = useCurrency();

  const form = useForm<CurrencyFormValues>({
    resolver: zodResolver(currencySchema),
    defaultValues: {
      currency: initialCurrency,
      usdConversionRate: initialConversionRate,
    },
  });

  const onSubmit = async (values: CurrencyFormValues) => {
    setIsSubmitting(true);
    try {
      // Update both currency and conversion rate
      await Promise.all([
        updateCurrency(values.currency),
        updateUsdConversionRate(values.usdConversionRate),
      ]);
      
      // Update the currency in the provider context
      setCurrency(values.currency);
      
      // Refresh the page to reload with new settings
      window.location.reload();
    } catch (error) {
      console.error("Error updating currency settings:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Currency Settings</CardTitle>
        <CardDescription>
          Configure the USD to INR conversion rate for currency display.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Currency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                      <SelectItem value="USD">US Dollar ($)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select your preferred currency for displaying amounts throughout the app and in receipt descriptions.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="usdConversionRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>USD to INR Conversion Rate</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="83.00"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the conversion rate (1 USD = X INR). This rate is used to convert INR amounts to USD for display.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Settings"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

