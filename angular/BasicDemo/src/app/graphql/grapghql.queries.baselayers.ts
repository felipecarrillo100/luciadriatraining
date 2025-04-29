import {gql} from "@apollo/client";

export const BaseLayerLtsFragmentDoc = gql`
    fragment BaseLayerLts on BaselayerLtsOutput {
  endpoint
  datasetId
}
    `;

export const BaseLayerWmsFragmentDoc = gql`
    fragment BaseLayerWms on BaselayerWmsOutput {
  endpoint
  datasetId
  imageFormat
}
    `;
export const BaseLayerFragmentDoc = gql`
    fragment BaseLayer on BaselayerOutput {
  ... on CoreBaselayer {
    id
    type
    label
  }
  ...BaseLayerLts
  ...BaseLayerWms
}
${BaseLayerLtsFragmentDoc}
${BaseLayerWmsFragmentDoc}`;
export const GetAllBaseLayersDocument = gql`
    query getAllBaseLayers($pageSize: Int!, $pageNumber: Int!) {
  getAllBaselayers(
    paging: {pageNumber: $pageNumber, pageSize: $pageSize}
    filter: REALISTIC
  ) {
    total
    pageSize
    contents {
      ...BaseLayer
    }
  }
}

${BaseLayerFragmentDoc}`;

