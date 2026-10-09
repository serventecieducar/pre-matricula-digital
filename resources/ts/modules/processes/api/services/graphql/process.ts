import { ErrorResponse, ID, Option, Processes } from '@/types';
import {
  Period,
  Process,
  ProcessCheck,
  ProcessCreate,
  ProcessCreateCourses,
  ProcessCreateListCourses,
  ProcessCreateResponse,
  ProcessGetList,
  ProcessPostAction,
  ProcessPostStage,
  ProcessRejectInBatchResponse,
  ProcessShow,
  ProcessStage,
  ProcessStageResponse
} from '@/modules/processes/types';
import { getDate, getFormattedTime } from '@/datetime';
import { graphql } from '@/modules/processes/api';
import { stageStatusText } from '@/util';

interface ProcessesListResponse {
  data: {
    data: {
      processes: {
        data: Processes[];
      };
    };
  };
}

export const listPublic = (): Promise<Processes[]> => {
  const payload = {
    query: `
      {
        publicProcesses(first: 100) {
          data {
            id
            name
            showWaitingList
            criteria
            stages {
              id
              type
              name
              startAt
              endAt
              status
            }
            schoolYear {
              year
            }
            grades {
              id
              name
            }
          }
        }
      }
    `,
  };

  return graphql<ProcessesListResponse>(payload).then((res) => {
    const pagina = res.data.data as unknown as {
      publicProcesses: { data: Processes[] };
    };

    return pagina.publicProcesses.data;
  });
};

export const list = (): Promise<Processes[]> => {
  const payload = {
    query: `
      {
        processes(
          first: 100
          active: true
        ) {
          data {
            id
            name
            showWaitingList
            criteria
            stages {
              id
              type
              name
              startAt
              endAt
              status
            }
            schoolYear {
              year
            }
            grades {
              id
              name
            }
          }
        }
      }
    `,
  };

  return graphql<ProcessesListResponse>(payload).then(res => res.data.data.processes.data);
};

export const getOnlyName = (): Promise<Processes[]> => {
  const payload = {
    query: `
      {
        processes(
          first: 100
          active: true
        ) {
          data {
            id
            name
          }
        }
      }
    `,
  };

  return graphql<ProcessesListResponse>(payload).then(res => res.data.data.processes.data);
};

export const remove = (data: ID): Promise<ProcessPostAction> => {
  const payload = {
    variables: data,
    query: `
      mutation deleteProcess($id: ID!) {
        process: deleteProcess(id: $id) {
          id
        }
      }
    `,
  };

  return graphql<{
    data: {
      errors: ErrorResponse[];
      data: {
        process: ProcessShow;
      };
    };
  }>(payload)
    .then(res => ({
      errors: res.data.errors,
      process: res.data.data.process,
    }));
};

export const show = (data: ID): Promise<ProcessCheck> => {
  const payload = {
    variables: data,
    query: `
      query process($id: ID!) {
        process(id: $id) {
          id
          name
          schoolYear {
            year
          }
          stages {
            id
            type
            name
            startAt
            endAt
            status
          }
          grades {
            id
            name
            startBirth
            endBirth
          }
          periods {
            id
            name
          }
          schools {
            id
            name
            latitude
            longitude
          }
          fields {
            id
            order
            field {
              id
              name
              group
              type
              internal
              options {
                id
                key: id
                name
                label: name
              }
            }
            required
            weight
          }
          vacancies {
            school
            period
            grade
            total
            available
          }
        }
      }
    `,
  };

  return graphql<{
    data: {
      data: {
        process: ProcessCheck;
      }
    }
  }>(payload)
    .then(res => res.data.data.process);
};

export const post = (data: ProcessCreate): Promise<ID> => {
  const payload = {
    variables: {
      input: data
    },
    query: `
      mutation save(
        $input: ProcessInput!
      ) {
        process: saveProcess(
          input: $input
        ) {
          id
        }
      }
    `,
  };

  return graphql<{
    data: {
      data: {
        process: ID
      }
    }
  }>(payload)
    .then(res => res.data.data.process);
};

export const postStages = (data: {
  id: string;
  stages: ProcessPostStage[]
}) => {
  const payload = {
    variables: data,
    query: `
      mutation save(
        $id: ID!
        $stages: [ProcessStageInput!]!
      ) {
        process: saveProcessStages(
            id: $id
            stages: $stages
        ) {
          id
        }
      }
    `,
  };

  return graphql<{
    data: {
      data: {
        process: ID
      }
    }
  }>(payload).then(res => res.data.data.process);
};

export const postCopy = (data: ID): Promise<ProcessPostAction> => {
  const payload = {
    variables: data,
    query: `
      mutation copyProcess($id: ID!) {
        process: copyProcess(id: $id) {
          id
        }
      }
    `,
  };

  return graphql<{
    data: {
      errors: ErrorResponse[];
      data: {
        process: ProcessShow;
      };
    };
  }>(payload)
    .then(res => ({
      errors: res.data.errors,
      process: res.data.data.process,
    }));
};

export const listCreate = (data: ID): Promise<ProcessCreate> => {
  const payload = {
    variables: data,
    query: `
      query process($id: ID!) {
        process(id:$id) {
          id
          name
          active
          messageFooter
          gradeAgeRangeLink
          forceSuggestedGrade
          showPriorityProtocol
          allowResponsibleSelectMapAddress
          blockIncompatibleAgeGroup
          autoRejectByDays
          autoRejectDays
          selectedSchools
          waitingListLimit
          minimumAge
          onePerYear
          showWaitingList
          rejectType
          criteria
          schoolYear {
            id
          }
          grades {
            id
          }
          periods {
            id
          }
          schools: schoolsSelected {
            id
          }
          grouper {
            id
          }
        }
      }
    `,
  };

  return graphql<{
    data: {
      data: {
        process: ProcessCreateResponse
      }
    }
  }>(payload)
    .then(res => {
      const { process } = res.data.data;
      const grades = process.grades.map((g) => g.id);
      const periods = process.periods.map((p) => p.id);
      const schools = process.schools.map((p) => p.id);

      return {
        ...process,
        grouper: process.grouper?.id,
        grades,
        periods,
        schoolYear: process.schoolYear.id,
        schools,
      };
    });
};

export const listCourses = (): Promise<ProcessCreateListCourses> => {
  const payload = {
    query: `
      {
        courses(first:100) {
          data {
            id
            name
            grades(first:100) {
              data {
                id
                name
              }
            }
          }
        }
        periods(first:100) {
          data {
            id
            name
          }
        }
        schoolYears(first:100) {
          data {
            key: id
            label: year
          }
        }
        schools(first:200) {
          data {
            key: id
            label: name
          }
        }
        groupers {
          key: id
          label: name
        }
      }
    `,
  };

  return graphql<{
    data: {
      data: {
        courses: {
          data: ProcessCreateCourses[];
        };
        periods: {
          data: Period[];
        };
        schoolYears: {
          data: Option[];
        };
        schools: {
          data: Option[];
        };
        groupers: Option[];
      } ;
    };
  }>(payload)
    .then(res => {
      const courses = res.data.data.courses.data.map(course => ({
        ...course,
        grades: course.grades.data,
      }));

      return {
        courses,
        periods: res.data.data.periods.data,
        schoolYears: res.data.data.schoolYears.data,
        schools: res.data.data.schools.data,
        groupers: res.data.data.groupers,
      };
    });
};

export const listStages = (data: ID): Promise<ProcessStageResponse> => {
  const payload = {
    variables: data,
    query: `
      query ProcessStages($id: ID!) {
        process(id: $id) {
          id
          name
          stages {
            id
            type
            radius
            startAt
            endAt
            startHourAt: startAt
            endHourAt: endAt
            observation
            renewalAtSameSchool
            allowWaitingList
            restrictionType
            allowSearch
          }
        }
      }
    `,
  };

  return graphql<{
    data: {
      data: {
        process: {
          id: string;
          name: string;
          stages: ProcessStage[];
        }
      }
    }
  }>(payload)
    .then(res => {
      const stages = res.data.data.process.stages.map((s) => ({
        ...s,
        startAt: getDate(s.startAt as string),
        endAt: getDate(s.endAt as string),
        startHourAt: getFormattedTime(s.startHourAt as string),
        endHourAt: getFormattedTime(s.endHourAt as string),
      }));

      return {
        process: {
          id: res.data.data.process.id,
          name: res.data.data.process.name,
        },
        stages: stages,
      };
    });
};

export const getList = (): Promise<ProcessGetList> => {
  const payload = {
    query: `
      query {
        processes (
          first: 100
        ) {
          data {
            id
            key: id
            label: name
            name
            active
            schoolYear {
              year
            }
            stages {
              id
              type
              name
              startAt
              endAt
              status
            }
          }
        }
      }
    `,
  };

  return graphql<{
    data: {
      data: {
        processes: {
          data: Process[];
        };
      };
    };
  }>(payload)
    .then(res => {
      const years = res.data.data.processes.data.map(
        (process) => process.schoolYear.year,
      ).filter((v, i, a) => a.indexOf(v) === i)
        .map((year) => ({ key: year, label: year }))
        .sort((a, b) => b.key - a.key) as unknown as Option[];

      const statusArray: string[] = [];

      res.data.data.processes.data.forEach((process) => {
        process.stages.forEach((stage) => {
          statusArray.push(stage.status);
        });
      });

      return {
        processes: res.data.data.processes.data.sortBy('name'),
        years,
        status: statusArray.filter((v, i, a) => a.indexOf(v) === i)
        .map((status) => ({ key: status, label: stageStatusText(status).toUpperCase() })).sortBy('label'),
      };
    });
};

export const getShow = (data: ID): Promise<ProcessShow> => {
  const payload = {
    variables: data,
    query: `
      query process($id: ID!) {
        process(id: $id) {
          id
          name
          schoolYear {
            year
          }
          stages {
            id
            type
            name
            startAt
            endAt
            status
            observation
            totalWaitingPreRegistrations
          }
          periods {
            id
            name
          }
          fields {
            id
            field {
              name
              group
              type
            }
            required
            weight
          }
        }
      }
    `,
  };

  return graphql<{
    data: {
      data: {
        process: ProcessShow;
      };
    };
  }>(payload)
    .then(res => res.data.data.process);
};

export const postRejectInBatch = (data: {
  id: string;
  stageId: string;
  justification: string;
}): Promise<ProcessRejectInBatchResponse> => {
  const payload = {
    variables: data,
    query: `
      mutation rejectInBatch(
        $id: ID!
        $stageId: ID!
        $justification: String
      ) {
        rejectInBatch(
          id: $id
          stageId: $stageId
          justification: $justification
        )
      }
    `,
  };

  return graphql<{
    data: {
      errors?: ErrorResponse[];
      data: {
        rejectInBatch: number;
      };
    };
  }>(payload)
    .then(res => ({
      errors: res.data.errors,
      rejectInBatch: res.data.data.rejectInBatch,
    }));
};
