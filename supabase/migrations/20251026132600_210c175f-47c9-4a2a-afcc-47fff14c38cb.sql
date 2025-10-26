-- Delete invalid votes that were inserted before security fix
-- These are votes with values that don't match the election's ballot options

DELETE FROM public.anonymous_votes
WHERE id IN (
  'acd9a4aa-53f7-4cb2-a94a-6845a7e1de7b',
  'ff0510d5-9794-43b4-a8da-c25982ad0932',
  'd8c75e84-655f-4afb-8ca9-f76ff09ea276',
  '0a98c741-7390-42f4-90b7-a1c85bdcc943',
  'adcb314e-cea4-45f9-9c7e-d15230b0df8d',
  '3bbac208-c576-43a8-b2ad-5d677a9f3c07',
  'b8655d78-a49f-4518-aa0b-8c9946aaddd5',
  'c8aabeb3-4c8f-4ebe-92f0-3ff96b0ce54e',
  '47f75f39-5aa6-48ad-8b55-28d89e042f13',
  'b9c9850b-8cd6-4040-8deb-77623c0fc980',
  '3eb7e752-a3c7-464f-8fc8-c0ae3866c782',
  'f9b81b75-b5b4-450a-ac2d-701fc5e955ee',
  '5d298e48-b422-4c54-9adf-29a3a1ddd85a',
  '2c929554-85ad-4f95-bbbf-1fc28bfb61b8',
  '8da8cfa6-9798-4626-91f8-182f5021a7e5'
) AND vote_value = 'HOLA!' AND election_id = 'ebd5bf39-0daf-402a-b79f-b2011f6e3c08';