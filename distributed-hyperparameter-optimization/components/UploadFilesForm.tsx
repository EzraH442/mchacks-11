import { useForm } from 'react-hook-form';
import { Form, FormField, FormItem, FormLabel } from './ui/form';
import { useState } from 'react';
import { Input } from './ui/input';
import * as g from '@/auto-generated';
import { Button } from './ui/button';
import { Separator } from './ui/separator';

interface IUploadFilesForm {}

const UploadFilesForm: React.FC<IUploadFilesForm> = () => {
  const form = useForm();

  const url =
    process.env.NODE_ENV === 'production'
      ? 'https://mchacks11.ezrahuang.com'
      : 'http://localhost:8080';

  const [modelFile, setModelFile] = useState<File | null>(null);
  const [trainingFile, setTrainingFile] = useState<File | null>(null);
  const [evaluationFile, setEvaluationFile] = useState<File | null>(null);

  const onModelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setModelFile(files[0]);
    }
  };

  const onTrainingFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setTrainingFile(files[0]);
    }
  };

  const onEvaluationFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setEvaluationFile(files[0]);
    }
  };

  const makeUploadRequest = async () => {
    const formData = new FormData();
    formData.append('model', modelFile as Blob);
    formData.append('training', trainingFile as Blob);
    formData.append('evaluation', evaluationFile as Blob);

    try {
      console.log('sending request', formData);
      const response = await fetch(`${url}/upload`, {
        method: 'POST',
        body: formData,
      });
      console.log('response', response);
      const res = (await response.json()) as g.UploadFilesMessage;

      console.log(res);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <Form {...form}>
        <FormItem>
          <FormLabel>Model File:</FormLabel>
          <Input type="file" onChange={onModelFileChange} />
        </FormItem>
        <FormItem>
          <FormLabel>Training File:</FormLabel>
          <Input type="file" onChange={onTrainingFileChange} />
        </FormItem>
        <FormItem>
          <FormLabel>Evaluation File:</FormLabel>
          <Input type="file" onChange={onEvaluationFileChange} />
        </FormItem>
        <Separator orientation="horizontal" className="my-4" />
        <Button onClick={() => makeUploadRequest()}>Submit</Button>
      </Form>
    </div>
  );
};

export default UploadFilesForm;
