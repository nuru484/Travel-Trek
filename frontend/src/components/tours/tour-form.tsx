"use client";
import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCreateTourMutation,
  useUpdateTourMutation,
  ITourPayload,
} from "@/redux/tourApi";
import toast from "react-hot-toast";
import { ITour } from "@/types/tour.types";
import { extractApiErrorMessage } from "@/utils/extractApiErrorMessage";

const tourFormSchema = z.object({
  name: z.string().min(1, "Tour name is required"),
  description: z.string().optional().nullable(),
  type: z.enum(
    ["ADVENTURE", "CULTURAL", "BEACH", "CITY", "WILDLIFE", "CRUISE"],
    {
      message: "Tour type is required",
    }
  ),
  duration: z.number().min(1, "Duration must be a positive number"),
  price: z.number().min(0, "Price must be a non-negative number"),
  maxGuests: z.number().min(1, "Max guests must be a positive number"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  location: z.string().min(1, "Location is required"),
});

type TourFormValues = z.infer<typeof tourFormSchema>;

interface ITourFormProps {
  tour?: ITour;
  mode: "create" | "edit";
}

const tourTypes = [
  "ADVENTURE",
  "CULTURAL",
  "BEACH",
  "CITY",
  "WILDLIFE",
  "CRUISE",
] as const;

export function TourForm({ tour, mode }: ITourFormProps) {
  const router = useRouter();
  const [createTour, { isLoading: isCreating }] = useCreateTourMutation();
  const [updateTour, { isLoading: isUpdating }] = useUpdateTourMutation();

  const form = useForm<TourFormValues>({
    resolver: zodResolver(tourFormSchema),
    defaultValues: {
      name: tour?.name || "",
      description: tour?.description || "",
      type: tour?.type || "ADVENTURE",
      duration: tour?.duration || 0,
      price: tour?.price || 0,
      maxGuests: tour?.maxGuests || 0,
      startDate: tour?.startDate
        ? tour.startDate.split("T")[0] +
          "T" +
          tour.startDate.split("T")[1].slice(0, 5)
        : "",
      endDate: tour?.endDate
        ? tour.endDate.split("T")[0] +
          "T" +
          tour.endDate.split("T")[1].slice(0, 5)
        : "",
      location: tour?.location || "",
    },
  });

  const onSubmit = async (values: TourFormValues) => {
    try {
      const tourData: ITourPayload = {
        name: values.name,
        description: values.description || null,
        type: values.type,
        duration: values.duration,
        price: values.price,
        maxGuests: values.maxGuests,
        startDate: new Date(values.startDate).toISOString(),
        endDate: new Date(values.endDate).toISOString(),
        location: values.location,
      };

      if (mode === "create") {
        await createTour(tourData).unwrap();
        toast.success("Tour created successfully");
      } else {
        await updateTour({
          id: tour!.id.toString(),
          tourData,
        }).unwrap();
        toast.success("Tour updated successfully");
      }

      router.push("/dashboard/tours");
    } catch (error) {
      console.error(`Failed to ${mode} tour:`, error);
      const apiError = extractApiErrorMessage(error).message;
      toast.error(apiError || `Failed to ${mode} tour`);
    }
  };

  const isLoading = isCreating || isUpdating;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/dashboard/tours")}
          disabled={isLoading}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>
            {mode === "create" ? "Create New Tour" : "Edit Tour"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tour Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Safari Adventure" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Explore the wilderness..."
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tour Type</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select tour type" />
                        </SelectTrigger>
                        <SelectContent>
                          {tourTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (days)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 7"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 999.99"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="maxGuests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Guests</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 20"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Serengeti, Tanzania"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/tours")}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading
                    ? "Saving..."
                    : mode === "create"
                    ? "Create Tour"
                    : "Update Tour"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
