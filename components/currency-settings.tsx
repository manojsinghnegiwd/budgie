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
import { updateUsdConversionRate } from "@/app/actions/settings";

const currencySchema = z.object({
  usdConversionRate: z.number().positive("Conversion rate must be positive"),
});

type CurrencyFormValues = z.infer<typeof currencySchema>;

interface CurrencySettingsProps {
  initialConversionRate: number;
}

export function CurrencySettings({ initialConversionRate }: CurrencySettingsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CurrencyFormValues>({
    resolver: zodResolver(currencySchema),
    defaultValues: {
      usdConversionRate: initialConversionRate,
    },
  });

  const onSubmit = async (values: CurrencyFormValues) => {
    setIsSubmitting(true);
    try {
      await updateUsdConversionRate(values.usdConversionRate);
      // Optionally show a success message
    } catch (error) {
      console.error("Error updating conversion rate:", error);
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
              {isSubmitting ? "Saving..." : "Save Conversion Rate"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

