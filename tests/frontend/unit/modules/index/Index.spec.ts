import '@/plugin/sortby';
import { VueWrapper, flushPromises, mount } from '@vue/test-utils';
import Index from '@/modules/index/components/Index.vue';
import { Notice } from '@/modules/notice/types';
import { Notice as NoticeApi } from '@/modules/notice/api';
import { Process as ProcessApi } from '@/modules/processes/api';
import { Processes } from '@/types';
import VTooltip from 'v-tooltip';
import { createTestingPinia } from '@pinia/testing';
import { getCookie } from '@/util';
import { expect, vi } from 'vitest';

const spyPush = vi.fn();

vi.mock('vue-router/dist/vue-router.mjs', () => ({
  useRouter: () => ({
    push: spyPush,
  }),
}));
vi.mock('@/modules/notice/api');
vi.mock('@/modules/processes/api');
vi.mock('@/util');

interface Params {
  error: boolean;
}

interface ProcessesParams extends Params {
  processes: Processes[];
}

const noticeMock = {
  id: 1,
  text: 'Notice 1',
};

const processesMock = [
  {
    id: 'string',
    name: 'string',
    schoolYear: {
      year: 2021,
    },
    stages: [
      {
        endAt: '2020-10-19 23:59:00',
        id: '1',
        name: 'Test',
        startAt: '2020-10-14 00:00:00',
        status: 'CLOSED',
        type: 'REGISTRATION_RENEWAL',
      },
    ],
    grades: [
      {
        id: 27,
        name: 'Nível I',
      },
    ],
  },
];

const onMounted = async (notice: Notice, processesParams: ProcessesParams) => {
  vi.mocked(getCookie).mockReturnValueOnce('1');

  vi.mocked(NoticeApi.list).mockResolvedValueOnce(notice);

  if (processesParams.error) {
    vi.mocked(ProcessApi.listPublic).mockRejectedValueOnce(processesParams.processes);
  } else {
    vi.mocked(ProcessApi.listPublic).mockResolvedValueOnce(processesParams.processes);
  }

  const wrapper = mount(Index, {
    global: {
      plugins: [createTestingPinia()],
      directives: {
        tooltip: VTooltip,
      },
      stubs: ['router-link', 'protocol-consult', 'process-stages'],
      mocks: {
        $router: () => ({
          push: spyPush,
        }),
      },
    },
  });

  await wrapper.vm.$nextTick();

  await flushPromises();

  return wrapper;
};

describe('Index', () => {
  let wrapper: VueWrapper<InstanceType<typeof Index>>;

  beforeEach(async () => {
    wrapper = await onMounted(noticeMock, {
      error: false,
      processes: processesMock,
    });

    await wrapper.vm.$nextTick();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('the component exists', () => {
    expect(wrapper).toBeTruthy();
  });

  test('should match snapshot', () => {
    expect(wrapper.element).toMatchSnapshot();
  });

  test('the initial variables must be loaded with the correct data', () => {
    expect(wrapper.vm.notice).toMatchObject(noticeMock);
  });

  test('if has notices, the notice component must be rendered', () => {
    expect(wrapper.vm.hasNotice).toBeTruthy();

    const noticeBlock = wrapper.find('[data-test="notice-block"]');

    expect(noticeBlock.exists()).toBeTruthy();
  });

  test("if has'nt notices, the notice component should not be rendered", async () => {
    wrapper = await onMounted({} as Notice, {
      error: false,
      processes: processesMock,
    });

    const noticeBlock = wrapper.find('[data-test="notice-block"]');

    expect(noticeBlock.exists()).toBeFalsy();
  });

  test('if has processes, the processes component must be rendered', () => {
    const processes = wrapper.findAll('[data-test="process-block"]');

    expect(processes.length).toBe(1);
  });

  test("if has'nt processes, the processes component should not be rendered", async () => {
    wrapper = await onMounted({} as Notice, {
      error: true,
      processes: undefined as unknown as Processes[],
    });

    const processes = wrapper.findAll('[data-test="process-block"]');

    expect(processes.length).toBe(0);
  });

  test('should show modal intro, if showVideoTutorial is true', async () => {
    vi.mocked(getCookie).mockReturnValueOnce(undefined);

    wrapper = await onMounted(noticeMock, {
      error: false,
      processes: processesMock,
    });

    expect(wrapper.vm.showVideoTutorial).toBeTruthy();
  });

  test("shouldn't show modal intro, if showVideoTutorial is false", async () => {
    expect(wrapper.vm.showVideoTutorial).toBeFalsy();
  });
});
