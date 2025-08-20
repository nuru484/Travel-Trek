// src/components/flights/flight-form.tsx
"use client";
import React, { useEffect } from "react";
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
  useCreateFlightMutation,
  useUpdateFlightMutation,
} from "@/redux/flightApi";
import { useGetAllDestinationsQuery } from "@/redux/destinationApi";
import toast from "react-hot-toast";
import { IFlight } from "@/types/flight.types";
import Image from "next/image";
import { extractApiErrorMessage } from "@/utils/extractApiErrorMessage";
import { FlightClass } from "@/types/flight.types";
import { IDestination } from "@/types/destination.types";

const flightFormSchema = z.object({
  flightNumber: z.string().min(1, "Flight number is required"),
  airline: z.string().min(1, "Airline is required"),
  departure: z.string().min(1, "Departure date is required"),
  arrival: z.string().min(1, "Arrival date is required"),
  originId: z.number().min(1, "Origin is required"),
  destinationId: z.number().min(1, "Destination is required"),
  price: z.number().min(0, "Price must be a positive number"),
  flightClass: z.enum(FlightClass, {
    message: "Flight class is required",
  }),
  duration: z.number().min(1, "Duration must be a positive number"),
  stops: z.number().min(0, "Stops must be a non-negative number").optional(),
  seatsAvailable: z
    .number()
    .min(0, "Seats available must be a non-negative number"),
  flightPhoto: z.any().optional(),
});

type FlightFormValues = z.infer<typeof flightFormSchema>;

interface IFlightFormProps {
  flight?: IFlight;
  mode: "create" | "edit";
}

const flightClasses = [
  "Economy",
  "Premium Economy",
  "Business",
  "First",
] as const;

export function FlightForm({ flight, mode }: IFlightFormProps) {
  const router = useRouter();
  const [createFlight, { isLoading: isCreating }] = useCreateFlightMutation();
  const [updateFlight, { isLoading: isUpdating }] = useUpdateFlightMutation();
  const { data: destinationsData, isLoading: isDestinationsLoading } =
    useGetAllDestinationsQuery({ limit: 100 });
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(
    flight?.photo || null
  );

  // Transform destinationsData.data to an array of IDestination
  const destinations: IDestination[] = React.useMemo(() => {
    return destinationsData?.data || [];
  }, [destinationsData]);

  const form = useForm<FlightFormValues>({
    resolver: zodResolver(flightFormSchema),
    defaultValues: {
      flightNumber: flight?.flightNumber || "",
      airline: flight?.airline || "",
      departure: flight?.departure
        ? flight.departure.split("T")[0] +
          "T" +
          flight.departure.split("T")[1].slice(0, 5)
        : "",
      arrival: flight?.arrival
        ? flight.arrival.split("T")[0] +
          "T" +
          flight.arrival.split("T")[1].slice(0, 5)
        : "",
      originId: flight?.originId || 0,
      destinationId: flight?.destinationId || 0,
      price: flight?.price || 0,
      flightClass: flight?.flightClass || FlightClass.ECONOMY,
      duration: flight?.duration || 0,
      stops: flight?.stops || 0,
      seatsAvailable: flight?.seatsAvailable || 0,
      flightPhoto: undefined,
    },
  });

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (value: File | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      onChange(file);
    } else {
      setPreviewUrl(null);
      onChange(null);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl && !flight?.photo) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl, flight?.photo]);

  const onSubmit = async (values: FlightFormValues) => {
    try {
      const formData = new FormData();
      formData.append("flightNumber", values.flightNumber);
      formData.append("airline", values.airline);
      formData.append("departure", new Date(values.departure).toISOString());
      formData.append("arrival", new Date(values.arrival).toISOString());
      formData.append("originId", values.originId.toString());
      formData.append("destinationId", values.destinationId.toString());
      formData.append("price", values.price.toString());
      formData.append("flightClass", values.flightClass);
      formData.append("duration", values.duration.toString());
      if (values.stops !== undefined)
        formData.append("stops", values.stops.toString());
      formData.append("seatsAvailable", values.seatsAvailable.toString());
      if (values.flightPhoto)
        formData.append("flightPhoto", values.flightPhoto);

      if (mode === "create") {
        await createFlight(formData).unwrap();
        toast.success("Flight created successfully");
      } else {
        await updateFlight({
          id: flight!.id.toString(),
          formData,
        }).unwrap();
        toast.success("Flight updated successfully");
      }

      router.push("/dashboard/flights");
    } catch (error) {
      console.error(`Failed to ${mode} flight:`, error);
      const apiError = extractApiErrorMessage(error);
      toast.error(apiError || `Failed to ${mode} flight`);
    }
  };

  const isLoading = isCreating || isUpdating || isDestinationsLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/dashboard/flights")}
          disabled={isLoading}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>
            {mode === "create" ? "Create New Flight" : "Edit Flight"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="flightNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Flight Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., AA123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="airline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Airline</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Gbewaa Airlines" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="departure"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departure</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="arrival"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Arrival</FormLabel>
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
                  name="originId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Origin</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(parseInt(value))
                          }
                          defaultValue={field.value?.toString()}
                          disabled={isDestinationsLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select origin" />
                          </SelectTrigger>
                          <SelectContent>
                            {destinations.map((dest) => (
                              <SelectItem
                                key={dest.id}
                                value={dest.id.toString()}
                              >
                                {dest.name} ({dest.city}, {dest.country})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="destinationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(parseInt(value))
                          }
                          defaultValue={field.value?.toString()}
                          disabled={isDestinationsLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select destination" />
                          </SelectTrigger>
                          <SelectContent>
                            {destinations.map((dest) => (
                              <SelectItem
                                key={dest.id}
                                value={dest.id.toString()}
                              >
                                {dest.name} ({dest.city}, {dest.country})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 299.99"
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

                <FormField
                  control={form.control}
                  name="flightClass"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Flight Class</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select flight class" />
                          </SelectTrigger>
                          <SelectContent>
                            {flightClasses.map((classType) => (
                              <SelectItem key={classType} value={classType}>
                                {classType}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 120"
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
                  name="stops"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stops (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 0"
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
              </div>

              <FormField
                control={form.control}
                name="seatsAvailable"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seats Available</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 150"
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
                name="flightPhoto"
                render={({ field: { onChange, value, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>Flight Photo (Optional)</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, onChange)}
                          {...fieldProps}
                        />
                        {(previewUrl || flight?.photo) && (
                          <div className="mt-2">
                            <Image
                              src={previewUrl || flight?.photo || ""}
                              alt="Flight photo preview"
                              className="h-24 w-24 object-cover rounded-md border border-input"
                              width={96}
                              height={96}
                            />
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/admin-dashboard/flights")}
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
                    ? "Create Flight"
                    : "Update Flight"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
