import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useForm } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Checkbox } from './ui/checkbox';
import { EHyperparameterDataType, EHyperparameterParameterType } from '@/types';

export interface IAddFormField {
  fieldName: string;
  hpType: EHyperparameterParameterType;
  type: EHyperparameterDataType;
  array: boolean;
}

interface AddFormFieldModalProps {
  onSubmit: (data: IAddFormField) => void;
}

const AddFormFieldModal: React.FC<AddFormFieldModalProps> = ({ onSubmit }) => {
  const form = useForm<IAddFormField>({
    defaultValues: {
      fieldName: '',
      hpType: EHyperparameterParameterType.CHOICE,
      type: EHyperparameterDataType.NUMBER,
      array: false,
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    console.log(data);
    onSubmit(data);
    form.reset();
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Add parameter</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Hyperparameter to Tune</DialogTitle>
          <DialogDescription>
            Add additional hyperparameters to optimize
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <FormField
            control={form.control}
            name="fieldName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Field name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="array"
            render={({ field }) => (
              <FormItem className="flex items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="leading-none">
                  <FormLabel>Array type?</FormLabel>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hpType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hyperparameter type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select parameter type"></SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={EHyperparameterParameterType.CHOICE}>
                      Choice
                    </SelectItem>
                    <SelectItem value={EHyperparameterParameterType.UNIFORM}>
                      Uniform
                    </SelectItem>
                    <SelectItem value={EHyperparameterParameterType.QUNIFORM}>
                      Quniform
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select parameter type"></SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={EHyperparameterDataType.NUMBER}>
                      number
                    </SelectItem>
                    <SelectItem value={EHyperparameterDataType.TEXT}>
                      text
                    </SelectItem>
                    <SelectItem value={EHyperparameterDataType.BOOL}>
                      bool
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </Form>

        <DialogFooter>
          <Button onClick={handleSubmit}>Add parameter</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddFormFieldModal;
