'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
   import {
        Form,
        FormControl,
        FormField,
        FormItem,
        FormLabel,
        FormMessage,
      } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

export default function ChangePasswordPage() {
    const form = useForm(); 

return (
    <div className="space-y-6">
        <h1 className='text-3xl font-bold tracking-tight text-slate-900'> Change password </h1>

    <Card className="max-w-2xl h-96">
    <div className= "p-5">
    <div className="p-5 space-y-5">
        <Form {...form}>
          <FormField
          control={form.control}
          name="Old password"
           render={({ field }) => (
            <FormItem>
            <div className= "space-x-10"> 
            <FormLabel> Old password</FormLabel>
            </div>
            <FormControl>
              <Input type="password"  {...field} className="bg-white w-96" />
            </FormControl>
            <FormMessage />
          </FormItem>
          )}
          />
           <FormField
          control={form.control}
          name="New password"
           render={({ field }) => (
            <FormItem>
            <FormLabel> New password</FormLabel>
            <FormControl>
              <Input type="password"  {...field} className="bg-white w-96" />
            </FormControl>
            <FormMessage />
          </FormItem>
          )}
          />
           <FormField
          control={form.control}
          name="Confirm new password"
           render={({ field }) => (
            <FormItem>
            <FormLabel> Confirm new password</FormLabel>
            <FormControl>
              <Input type="password"  {...field} className="bg-white w-96" />
            </FormControl>
            <FormMessage />
          </FormItem>
          )}
          />
        </Form>
      </div>
      <div className="flex items-center justify-left">  <Button className = "w-35"> Update Password </Button> </div>
    </div>
    </Card>
    </div>
)

}